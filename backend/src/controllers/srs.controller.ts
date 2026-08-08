import { RequestHandler } from "express";
import { Types } from "mongoose";
import { Word, WordDoc } from "../models/Word";
import { Sentence } from "../models/Sentence";
import { UserWordProgress } from "../models/UserWordProgress";
import { UserStats } from "../models/UserStats";
import { reviewWord, DIFFICULT_WORD_LAPSE_THRESHOLD } from "../services/srs.service";
import { pickBackfillWords } from "../services/interleaving.service";

export const nextBatch: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const limit = Math.min(20, Math.max(1, Number(req.query.limit) || 8));

    const dueProgress = await UserWordProgress.find({
      userId,
      dueDate: { $lte: new Date() },
    })
      .sort({ dueDate: 1 })
      .limit(limit)
      .populate<{ wordId: WordDoc }>("wordId");

    const dueWords = dueProgress.map((p) => p.wordId).filter((w): w is WordDoc => Boolean(w));

    let words: WordDoc[] = dueWords;

    if (words.length < limit) {
      const allProgressWordIds = await UserWordProgress.find({ userId }).distinct("wordId");
      const excludeIds = allProgressWordIds.map((id) => String(id));
      const backfill = await pickBackfillWords(excludeIds, limit - words.length);
      words = [...words, ...backfill];
    }

    // Nothing due and no brand-new words left either — the learner has been
    // through everything. Rather than showing an empty round, offer bonus
    // practice: a random sample of already-learned words, reviewed early.
    let bonusPractice = false;
    if (words.length < limit) {
      const usedWordIds = words.map((w) => w._id);
      const bonusProgress = await UserWordProgress.aggregate<{ wordId: Types.ObjectId }>([
        { $match: { userId: new Types.ObjectId(userId), wordId: { $nin: usedWordIds } } },
        { $sample: { size: limit - words.length } },
      ]);
      if (bonusProgress.length > 0) {
        const bonusWords = await Word.find({ _id: { $in: bonusProgress.map((p) => p.wordId) } });
        words = [...words, ...bonusWords];
        bonusPractice = true;
      }
    }

    // Progressive image fading (see FEATURE 1 "Rasm orqali yodlash"): a word
    // shows image+text together the first few times it's reviewed, then
    // image-only once the learner should be recalling it unaided. Only
    // words that already have a progress row are eligible — a word's very
    // first-ever appearance always shows image+text, which also means this
    // never creates progress rows early (that stays submitReview's job).
    const existingProgress = await UserWordProgress.find(
      { userId, wordId: { $in: words.map((w) => w._id) } },
      { wordId: 1, timesShown: 1 },
    );
    const imageHiddenByWordId: Record<string, boolean> = {};
    for (const w of words) imageHiddenByWordId[String(w._id)] = false;
    for (const p of existingProgress) {
      imageHiddenByWordId[String(p.wordId)] = (p.timesShown ?? 0) >= 3;
    }
    if (existingProgress.length > 0) {
      await UserWordProgress.updateMany(
        { userId, wordId: { $in: existingProgress.map((p) => p.wordId) } },
        { $inc: { timesShown: 1 } },
      );
    }

    res.json({ words, bonusPractice, imageHiddenByWordId });
  } catch (err) {
    next(err);
  }
};

export const submitReview: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const { wordId, result } = req.body ?? {};
    if (!wordId || (result !== "correct" && result !== "wrong" && result !== "helped")) {
      res.status(400).json({ error: "wordId and result ('correct'|'wrong'|'helped') are required" });
      return;
    }

    let progress = await UserWordProgress.findOne({ userId, wordId });
    if (!progress) {
      progress = await UserWordProgress.create({ userId, wordId });
    }

    // A hint-assisted recall isn't independent retrieval, so it resets the
    // SRS interval exactly like a wrong answer — the word resurfaces tomorrow.
    const updated = reviewWord(
      {
        easeFactor: progress.easeFactor,
        interval: progress.interval,
        repetitions: progress.repetitions,
        lapses: progress.lapses,
      },
      result === "helped" ? "wrong" : result,
    );

    progress.easeFactor = updated.easeFactor;
    progress.interval = updated.interval;
    progress.repetitions = updated.repetitions;
    progress.lapses = updated.lapses;
    progress.dueDate = updated.dueDate;
    progress.lastReviewedAt = new Date();
    progress.lastResult = result;
    if (result === "helped") progress.helpedCount += 1;
    await progress.save();

    if (result === "correct") {
      const today = new Date().toISOString().slice(0, 10);
      const stats = await UserStats.findOneAndUpdate(
        { userId },
        {
          $setOnInsert: { userId },
          $inc: { totalWordsLearned: progress.repetitions === 1 ? 1 : 0 },
        },
        { upsert: true, new: true },
      );
      if (stats.lastActiveDate !== today) {
        stats.wordsLearnedToday = 0;
      }
      stats.wordsLearnedToday += 1;
      stats.lastActiveDate = today;
      await stats.save();
    }

    res.json({ progress });
  } catch (err) {
    next(err);
  }
};

export const difficultWords: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const progress = await UserWordProgress.find({
      userId,
      lapses: { $gte: DIFFICULT_WORD_LAPSE_THRESHOLD },
    })
      .sort({ lapses: -1 })
      .populate<{ wordId: WordDoc }>("wordId");

    res.json({ words: progress.map((p) => p.wordId).filter(Boolean) });
  } catch (err) {
    next(err);
  }
};

export const sentenceForWord: RequestHandler = async (req, res, next) => {
  try {
    const wordId = req.query.wordId;
    if (!wordId || !Types.ObjectId.isValid(String(wordId))) {
      res.status(400).json({ error: "Valid wordId query param is required" });
      return;
    }
    const word = await Word.findById(wordId);
    if (!word) {
      res.status(404).json({ error: "Word not found" });
      return;
    }
    const sentence = await Sentence.findOne({
      "words.text": { $regex: new RegExp(`^${escapeRegex(word.english)}$`, "i") },
    });
    res.json({ sentence: sentence ?? null });
  } catch (err) {
    next(err);
  }
};

export const recallDistractors: RequestHandler = async (req, res, next) => {
  try {
    const wordId = req.query.wordId;
    const count = Math.min(10, Math.max(1, Number(req.query.count) || 4));
    if (!wordId || !Types.ObjectId.isValid(String(wordId))) {
      res.status(400).json({ error: "Valid wordId query param is required" });
      return;
    }
    const word = await Word.findById(wordId);
    if (!word) {
      res.status(404).json({ error: "Word not found" });
      return;
    }

    let pool: WordDoc[] = [];

    // Prefer distractors of the same part of speech (e.g. other verbs).
    if (word.partOfSpeech) {
      pool = await Word.aggregate<WordDoc>([
        { $match: { _id: { $ne: word._id }, partOfSpeech: word.partOfSpeech } },
        { $sample: { size: count } },
      ]);
    }

    // Fall back to words from the same lesson range.
    if (pool.length < count) {
      const excludeIds = [word._id, ...pool.map((w) => w._id)];
      const more = await Word.aggregate<WordDoc>([
        {
          $match: {
            _id: { $nin: excludeIds },
            lessonNumber: { $lte: word.lessonNumberEnd },
            lessonNumberEnd: { $gte: word.lessonNumber },
          },
        },
        { $sample: { size: count - pool.length } },
      ]);
      pool = [...pool, ...more];
    }

    // Last resort: any other word in the dictionary.
    if (pool.length < count) {
      const excludeIds = [word._id, ...pool.map((w) => w._id)];
      const more = await Word.aggregate<WordDoc>([
        { $match: { _id: { $nin: excludeIds } } },
        { $sample: { size: count - pool.length } },
      ]);
      pool = [...pool, ...more];
    }

    res.json({ distractors: pool });
  } catch (err) {
    next(err);
  }
};

export const recallCheck: RequestHandler = async (req, res, next) => {
  try {
    const { wordId, userAnswer } = req.body ?? {};
    if (!wordId || typeof userAnswer !== "string") {
      res.status(400).json({ error: "wordId and userAnswer are required" });
      return;
    }
    const word = await Word.findById(wordId);
    if (!word) {
      res.status(404).json({ error: "Word not found" });
      return;
    }
    const correct = normalize(userAnswer) === normalize(word.english);
    res.json({ correct, correctAnswer: word.english });
  } catch (err) {
    next(err);
  }
};

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, "");
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
