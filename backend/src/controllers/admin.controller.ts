import { RequestHandler } from "express";
import { suggestTranslation, suggestSentenceRoles, suggestIrregularVerb } from "../services/ai.service";
import { searchUnsplashPhotos } from "../services/unsplash.service";

export const aiAssistTranslate: RequestHandler = async (req, res, next) => {
  try {
    const { english } = req.body ?? {};
    if (!english || typeof english !== "string") {
      res.status(400).json({ error: "english is required" });
      return;
    }
    const suggestion = await suggestTranslation(english.trim());
    res.json({ suggestion });
  } catch (err) {
    next(err);
  }
};

export const aiAssistSentenceRoles: RequestHandler = async (req, res, next) => {
  try {
    const { english, korean } = req.body ?? {};
    if (!english || typeof english !== "string" || !korean || typeof korean !== "string") {
      res.status(400).json({ error: "english and korean are required" });
      return;
    }
    const suggestion = await suggestSentenceRoles(english.trim(), korean.trim());
    res.json({ suggestion });
  } catch (err) {
    next(err);
  }
};

export const aiAssistIrregularVerb: RequestHandler = async (req, res, next) => {
  try {
    const { base } = req.body ?? {};
    if (!base || typeof base !== "string") {
      res.status(400).json({ error: "base is required" });
      return;
    }
    const suggestion = await suggestIrregularVerb(base.trim());
    res.json({ suggestion });
  } catch (err) {
    next(err);
  }
};

export const unsplashSearch: RequestHandler = async (req, res, next) => {
  try {
    const { query } = req.query;
    if (!query || typeof query !== "string") {
      res.status(400).json({ error: "query is required" });
      return;
    }
    const photos = await searchUnsplashPhotos(query.trim());
    res.json({ photos });
  } catch (err) {
    next(err);
  }
};
