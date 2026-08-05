import { RequestHandler } from "express";
import { suggestTranslation, suggestSentenceRoles } from "../services/ai.service";

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
