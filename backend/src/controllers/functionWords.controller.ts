import { RequestHandler } from "express";
import { FunctionWord } from "../models/FunctionWord";
import { generateFunctionWordContent } from "../services/ai.service";
import { FUNCTION_WORD_CATEGORIES } from "../config/functionWords";

export const listFunctionWords: RequestHandler = async (req, res, next) => {
  try {
    const { category } = req.query;
    const filter: Record<string, unknown> = {};
    if (category) filter.category = category;
    const functionWords = await FunctionWord.find(filter).sort({ category: 1, order: 1, word: 1 });
    res.json({ functionWords });
  } catch (err) {
    next(err);
  }
};

export const getFunctionWord: RequestHandler = async (req, res, next) => {
  try {
    const functionWord = await FunctionWord.findById(req.params.id);
    if (!functionWord) {
      res.status(404).json({ error: "Function word not found" });
      return;
    }
    res.json({ functionWord });
  } catch (err) {
    next(err);
  }
};

export const createFunctionWord: RequestHandler = async (req, res, next) => {
  try {
    const { word, category } = req.body ?? {};
    if (!word || !FUNCTION_WORD_CATEGORIES.includes(category)) {
      res.status(400).json({ error: "word and a valid category are required" });
      return;
    }
    const normalized = String(word).trim().toLowerCase();
    const existing = await FunctionWord.findOne({ word: normalized });
    if (existing) {
      res.status(409).json({ error: "This word already exists", existing });
      return;
    }
    const functionWord = await FunctionWord.create({ ...req.body, word: normalized });
    res.status(201).json({ functionWord });
  } catch (err) {
    next(err);
  }
};

export const updateFunctionWord: RequestHandler = async (req, res, next) => {
  try {
    const body = { ...req.body };
    if (body.word) body.word = String(body.word).trim().toLowerCase();
    const functionWord = await FunctionWord.findByIdAndUpdate(req.params.id, body, {
      new: true,
      runValidators: true,
    });
    if (!functionWord) {
      res.status(404).json({ error: "Function word not found" });
      return;
    }
    res.json({ functionWord });
  } catch (err) {
    next(err);
  }
};

export const deleteFunctionWord: RequestHandler = async (req, res, next) => {
  try {
    const functionWord = await FunctionWord.findByIdAndDelete(req.params.id);
    if (!functionWord) {
      res.status(404).json({ error: "Function word not found" });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

export const aiGenerateFunctionWord: RequestHandler = async (req, res, next) => {
  try {
    const { word, category } = req.body ?? {};
    if (!word || !FUNCTION_WORD_CATEGORIES.includes(category)) {
      res.status(400).json({ error: "word and a valid category are required" });
      return;
    }
    const suggestion = await generateFunctionWordContent(String(word).trim(), category);
    res.json({ suggestion });
  } catch (err) {
    next(err);
  }
};
