import { RequestHandler } from "express";
import { Word } from "../models/Word";
import { bulkUploadWordsFromCsv } from "../services/csv.service";
import { generateWordAudio } from "../services/tts.service";
import { notifyNewWords } from "../services/push.service";
import { parseLessonRange, lessonRangeOverlapFilter } from "../utils/lessonRange";

// Best-effort: a TTS failure (missing key, rate limit, network) must never
// block word creation/editing — playback falls back to speechSynthesis
// without a clip, and scripts/generateAudio.ts's idempotent backfill can
// fill it in later.
async function attachAudio(word: InstanceType<typeof Word>): Promise<void> {
  try {
    const { audioUrl, koreanAudioUrl } = await generateWordAudio(word._id.toString(), word.english, word.korean);
    word.audioUrl = audioUrl;
    word.koreanAudioUrl = koreanAudioUrl;
    await word.save();
  } catch (err) {
    console.error(`Auto audio generation failed for word ${word._id}:`, err);
  }
}

export const listWords: RequestHandler = async (req, res, next) => {
  try {
    const { category, difficulty, lessons, english, page = "1", limit = "50" } = req.query;
    const filter: Record<string, unknown> = {};
    if (category) filter.category = category;
    if (difficulty) filter.difficulty = difficulty;
    if (english) {
      const escaped = String(english).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.english = { $regex: new RegExp(`^${escaped}$`, "i") };
    }
    if (lessons) {
      const lessonNumbers = String(lessons)
        .split(",")
        .map((n) => Number(n.trim()))
        .filter((n) => Number.isFinite(n));
      if (lessonNumbers.length > 0) Object.assign(filter, lessonRangeOverlapFilter(lessonNumbers));
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(500, Math.max(1, Number(limit) || 50));

    const [words, total] = await Promise.all([
      Word.find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Word.countDocuments(filter),
    ]);

    res.json({ words, total, page: pageNum, limit: limitNum });
  } catch (err) {
    next(err);
  }
};

export const getWord: RequestHandler = async (req, res, next) => {
  try {
    const word = await Word.findById(req.params.id);
    if (!word) {
      res.status(404).json({ error: "Word not found" });
      return;
    }
    res.json({ word });
  } catch (err) {
    next(err);
  }
};

export const createWord: RequestHandler = async (req, res, next) => {
  try {
    const { english, korean, force } = req.body ?? {};
    if (!english || !korean) {
      res.status(400).json({ error: "english and korean are required" });
      return;
    }
    const lessonRange = parseLessonRange(req.body ?? {});
    if (!lessonRange) {
      res.status(400).json({ error: "A valid lessonNumber (or lessonNumber-lessonNumberEnd range) is required" });
      return;
    }
    if (req.query.force !== "true" && !force) {
      const existing = await Word.findOne({ english, korean });
      if (existing) {
        res.status(409).json({ error: "This word pair already exists", existing });
        return;
      }
    }
    const word = await Word.create({ ...req.body, ...lessonRange });
    await attachAudio(word);
    notifyNewWords(1, word.english).catch((err) => console.error("Push notification failed:", err));
    res.status(201).json({ word });
  } catch (err) {
    next(err);
  }
};

export const updateWord: RequestHandler = async (req, res, next) => {
  try {
    const body = { ...req.body };
    if (body.lessonNumber !== undefined || body.lessonNumberEnd !== undefined) {
      const lessonRange = parseLessonRange(body);
      if (!lessonRange) {
        res.status(400).json({ error: "A valid lessonNumber (or lessonNumber-lessonNumberEnd range) is required" });
        return;
      }
      Object.assign(body, lessonRange);
    }

    const existing = await Word.findById(req.params.id, { english: 1, korean: 1 });
    if (!existing) {
      res.status(404).json({ error: "Word not found" });
      return;
    }
    const textChanged =
      (typeof body.english === "string" && body.english.trim() !== existing.english) ||
      (typeof body.korean === "string" && body.korean.trim() !== existing.korean);

    const word = await Word.findByIdAndUpdate(req.params.id, body, {
      new: true,
      runValidators: true,
    });
    if (!word) {
      res.status(404).json({ error: "Word not found" });
      return;
    }
    // Only regenerate when the pronounced text actually changed — an edit to
    // an unrelated field (lesson range, category, ...) shouldn't re-spend an
    // OpenAI call.
    if (textChanged) await attachAudio(word);
    res.json({ word });
  } catch (err) {
    next(err);
  }
};

export const deleteWord: RequestHandler = async (req, res, next) => {
  try {
    const word = await Word.findByIdAndDelete(req.params.id);
    if (!word) {
      res.status(404).json({ error: "Word not found" });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

export const bulkUploadWords: RequestHandler = async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "CSV file is required (field name: file)" });
      return;
    }
    const defaultLessonRange = parseLessonRange(req.body ?? {});
    if (!defaultLessonRange) {
      res.status(400).json({ error: "A valid lessonNumber (or lessonNumber-lessonNumberEnd range) form field is required" });
      return;
    }
    const result = await bulkUploadWordsFromCsv(req.file.buffer, defaultLessonRange);
    notifyNewWords(result.inserted).catch((err) => console.error("Push notification failed:", err));
    res.json(result);
  } catch (err) {
    next(err);
  }
};
