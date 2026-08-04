import { RequestHandler } from "express";
import { Sentence } from "../models/Sentence";

export const listSentences: RequestHandler = async (req, res, next) => {
  try {
    const { level, lessons, page = "1", limit = "50" } = req.query;
    const filter: Record<string, unknown> = {};
    if (level) filter.level = level;
    if (lessons) {
      const lessonNumbers = String(lessons)
        .split(",")
        .map((n) => Number(n.trim()))
        .filter((n) => Number.isFinite(n));
      if (lessonNumbers.length > 0) filter.lessonNumber = { $in: lessonNumbers };
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(500, Math.max(1, Number(limit) || 50));

    const [sentences, total] = await Promise.all([
      Sentence.find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Sentence.countDocuments(filter),
    ]);

    res.json({ sentences, total, page: pageNum, limit: limitNum });
  } catch (err) {
    next(err);
  }
};

export const getSentence: RequestHandler = async (req, res, next) => {
  try {
    const sentence = await Sentence.findById(req.params.id);
    if (!sentence) {
      res.status(404).json({ error: "Sentence not found" });
      return;
    }
    res.json({ sentence });
  } catch (err) {
    next(err);
  }
};

export const createSentence: RequestHandler = async (req, res, next) => {
  try {
    const { korean, englishWords, lessonNumber } = req.body ?? {};
    if (!korean || !Array.isArray(englishWords) || englishWords.length === 0) {
      res.status(400).json({ error: "korean and non-empty englishWords[] are required" });
      return;
    }
    if (lessonNumber === undefined || lessonNumber === null || Number.isNaN(Number(lessonNumber))) {
      res.status(400).json({ error: "lessonNumber is required" });
      return;
    }
    const sentence = await Sentence.create(req.body);
    res.status(201).json({ sentence });
  } catch (err) {
    next(err);
  }
};

export const updateSentence: RequestHandler = async (req, res, next) => {
  try {
    const sentence = await Sentence.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!sentence) {
      res.status(404).json({ error: "Sentence not found" });
      return;
    }
    res.json({ sentence });
  } catch (err) {
    next(err);
  }
};

export const deleteSentence: RequestHandler = async (req, res, next) => {
  try {
    const sentence = await Sentence.findByIdAndDelete(req.params.id);
    if (!sentence) {
      res.status(404).json({ error: "Sentence not found" });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
