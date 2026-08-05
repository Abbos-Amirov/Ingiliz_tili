import { RequestHandler } from "express";
import { Sentence } from "../models/Sentence";
import { parseLessonRange, lessonRangeOverlapFilter } from "../utils/lessonRange";
import { GRAMMAR_ROLES } from "../config/grammar";

const ROLE_SET = new Set<string>(GRAMMAR_ROLES);

function isValidRoleWordArray(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.every(
      (w) =>
        w &&
        typeof w === "object" &&
        typeof (w as Record<string, unknown>).text === "string" &&
        (w as Record<string, unknown>).text !== "" &&
        ROLE_SET.has((w as Record<string, unknown>).role as string),
    )
  );
}

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
      if (lessonNumbers.length > 0) Object.assign(filter, lessonRangeOverlapFilter(lessonNumbers));
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
    const { korean, words, distractorWords } = req.body ?? {};
    if (!korean || !Array.isArray(words) || words.length === 0 || !isValidRoleWordArray(words)) {
      res.status(400).json({ error: "korean and a non-empty words[] of { text, role } are required" });
      return;
    }
    if (distractorWords !== undefined && !isValidRoleWordArray(distractorWords)) {
      res.status(400).json({ error: "distractorWords must be an array of { text, role }" });
      return;
    }
    const lessonRange = parseLessonRange(req.body ?? {});
    if (!lessonRange) {
      res.status(400).json({ error: "A valid lessonNumber (or lessonNumber-lessonNumberEnd range) is required" });
      return;
    }
    const sentence = await Sentence.create({ ...req.body, ...lessonRange });
    res.status(201).json({ sentence });
  } catch (err) {
    next(err);
  }
};

export const updateSentence: RequestHandler = async (req, res, next) => {
  try {
    const body = { ...req.body };
    if (body.words !== undefined && (!Array.isArray(body.words) || !isValidRoleWordArray(body.words))) {
      res.status(400).json({ error: "words must be a non-empty array of { text, role }" });
      return;
    }
    if (body.distractorWords !== undefined && !isValidRoleWordArray(body.distractorWords)) {
      res.status(400).json({ error: "distractorWords must be an array of { text, role }" });
      return;
    }
    if (body.lessonNumber !== undefined || body.lessonNumberEnd !== undefined) {
      const lessonRange = parseLessonRange(body);
      if (!lessonRange) {
        res.status(400).json({ error: "A valid lessonNumber (or lessonNumber-lessonNumberEnd range) is required" });
        return;
      }
      Object.assign(body, lessonRange);
    }
    const sentence = await Sentence.findByIdAndUpdate(req.params.id, body, {
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
