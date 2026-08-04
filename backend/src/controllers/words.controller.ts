import { RequestHandler } from "express";
import { Word } from "../models/Word";
import { bulkUploadWordsFromCsv } from "../services/csv.service";

export const listWords: RequestHandler = async (req, res, next) => {
  try {
    const { category, difficulty, lessons, page = "1", limit = "50" } = req.query;
    const filter: Record<string, unknown> = {};
    if (category) filter.category = category;
    if (difficulty) filter.difficulty = difficulty;
    if (lessons) {
      const lessonNumbers = String(lessons)
        .split(",")
        .map((n) => Number(n.trim()))
        .filter((n) => Number.isFinite(n));
      if (lessonNumbers.length > 0) filter.lessonNumber = { $in: lessonNumbers };
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
    const { english, korean, force, lessonNumber } = req.body ?? {};
    if (!english || !korean) {
      res.status(400).json({ error: "english and korean are required" });
      return;
    }
    if (lessonNumber === undefined || lessonNumber === null || Number.isNaN(Number(lessonNumber))) {
      res.status(400).json({ error: "lessonNumber is required" });
      return;
    }
    if (req.query.force !== "true" && !force) {
      const existing = await Word.findOne({ english, korean });
      if (existing) {
        res.status(409).json({ error: "This word pair already exists", existing });
        return;
      }
    }
    const word = await Word.create(req.body);
    res.status(201).json({ word });
  } catch (err) {
    next(err);
  }
};

export const updateWord: RequestHandler = async (req, res, next) => {
  try {
    const word = await Word.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!word) {
      res.status(404).json({ error: "Word not found" });
      return;
    }
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
    const defaultLessonNumber = Number(req.body?.lessonNumber);
    if (!Number.isFinite(defaultLessonNumber) || defaultLessonNumber <= 0) {
      res.status(400).json({ error: "lessonNumber (form field) is required" });
      return;
    }
    const result = await bulkUploadWordsFromCsv(req.file.buffer, defaultLessonNumber);
    res.json(result);
  } catch (err) {
    next(err);
  }
};
