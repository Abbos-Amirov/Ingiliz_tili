import { RequestHandler } from "express";
import { suggestTranslation } from "../services/ai.service";

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
