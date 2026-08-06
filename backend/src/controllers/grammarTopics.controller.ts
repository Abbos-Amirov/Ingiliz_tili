import { RequestHandler } from "express";
import { GrammarTopic } from "../models/GrammarTopic";
import { UserGrammarProgress } from "../models/UserGrammarProgress";
import { generateGrammarTopicContent } from "../services/ai.service";

export const listGrammarTopics: RequestHandler = async (req, res, next) => {
  try {
    const { level } = req.query;
    const filter: Record<string, unknown> = {};
    if (level) filter.level = level;
    const topics = await GrammarTopic.find(filter).sort({ level: 1, order: 1 });
    res.json({ topics });
  } catch (err) {
    next(err);
  }
};

export const getGrammarTopic: RequestHandler = async (req, res, next) => {
  try {
    const topic = await GrammarTopic.findById(req.params.id);
    if (!topic) {
      res.status(404).json({ error: "Grammar topic not found" });
      return;
    }
    res.json({ topic });
  } catch (err) {
    next(err);
  }
};

export const createGrammarTopic: RequestHandler = async (req, res, next) => {
  try {
    const { title, formula, level } = req.body ?? {};
    if (!title?.uz || !title?.en || !title?.ko || !formula || !level) {
      res.status(400).json({ error: "title (uz, en, ko), formula and level are required" });
      return;
    }
    const existing = await GrammarTopic.findOne({ "title.uz": String(title.uz).trim() });
    if (existing) {
      res.status(409).json({ error: "A grammar topic with this title already exists", topic: existing });
      return;
    }
    const topic = await GrammarTopic.create(req.body);
    res.status(201).json({ topic });
  } catch (err) {
    next(err);
  }
};

export const updateGrammarTopic: RequestHandler = async (req, res, next) => {
  try {
    const body = { ...req.body };
    if (body.title?.uz) {
      const dup = await GrammarTopic.findOne({ "title.uz": String(body.title.uz).trim(), _id: { $ne: req.params.id } });
      if (dup) {
        res.status(409).json({ error: "A grammar topic with this title already exists", topic: dup });
        return;
      }
    }
    const topic = await GrammarTopic.findByIdAndUpdate(req.params.id, body, {
      new: true,
      runValidators: true,
    });
    if (!topic) {
      res.status(404).json({ error: "Grammar topic not found" });
      return;
    }
    res.json({ topic });
  } catch (err) {
    next(err);
  }
};

export const deleteGrammarTopic: RequestHandler = async (req, res, next) => {
  try {
    const topic = await GrammarTopic.findByIdAndDelete(req.params.id);
    if (!topic) {
      res.status(404).json({ error: "Grammar topic not found" });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

export const aiGenerateGrammarContent: RequestHandler = async (req, res, next) => {
  try {
    const { title, formula, level } = req.body ?? {};
    if (!title || !formula || !level) {
      res.status(400).json({ error: "title, formula and level are required" });
      return;
    }
    const suggestion = await generateGrammarTopicContent(title, formula, level);
    res.json({ suggestion });
  } catch (err) {
    next(err);
  }
};

export const submitQuizResult: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const topicId = req.params.id;
    const { correct, total } = req.body ?? {};
    if (
      !Number.isInteger(correct) ||
      !Number.isInteger(total) ||
      total <= 0 ||
      correct < 0 ||
      correct > total
    ) {
      res.status(400).json({ error: "correct and total are required integers with 0 <= correct <= total" });
      return;
    }
    // Atomic $inc + upsert — avoids a find-then-create race when a user
    // submits results for the same topic in quick succession.
    const progress = await UserGrammarProgress.findOneAndUpdate(
      { userId, topicId },
      { $inc: { questionsCorrect: correct, questionsTotal: total }, $set: { lastPracticedAt: new Date() } },
      { upsert: true, new: true },
    );
    res.json({ progress });
  } catch (err) {
    next(err);
  }
};

export const getProgressSummary: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const progress = await UserGrammarProgress.find({ userId });
    res.json({ progress });
  } catch (err) {
    next(err);
  }
};
