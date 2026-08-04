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

    res.json({ words });
  } catch (err) {
    next(err);
  }
};

export const submitReview: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const { wordId, result } = req.body ?? {};
    if (!wordId || (result !== "correct" && result !== "wrong")) {
      res.status(400).json({ error: "wordId and result ('correct'|'wrong') are required" });
      return;
    }

    let progress = await UserWordProgress.findOne({ userId, wordId });
    if (!progress) {
      progress = await UserWordProgress.create({ userId, wordId });
    }

    const updated = reviewWord(
      {
        easeFactor: progress.easeFactor,
        interval: progress.interval,
        repetitions: progress.repetitions,
        lapses: progress.lapses,
      },
      result,
    );

    progress.easeFactor = updated.easeFactor;
    progress.interval = updated.interval;
    progress.repetitions = updated.repetitions;
    progress.lapses = updated.lapses;
    progress.dueDate = updated.dueDate;
    progress.lastReviewedAt = new Date();
    progress.lastResult = result;
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
      englishWords: { $regex: new RegExp(`^${escapeRegex(word.english)}$`, "i") },
    });
    res.json({ sentence: sentence ?? null });
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
