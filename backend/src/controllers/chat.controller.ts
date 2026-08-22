import { RequestHandler } from "express";
import { chatAboutSentence, ChatMessage } from "../services/ai.service";

function isValidHistory(value: unknown): value is ChatMessage[] {
  return (
    Array.isArray(value) &&
    value.every(
      (m) =>
        m &&
        typeof m === "object" &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string",
    )
  );
}

export const sentenceChat: RequestHandler = async (req, res, next) => {
  try {
    const { message, korean, englishWords, formula, locale, history } = req.body ?? {};
    if (!message || typeof message !== "string" || !message.trim()) {
      res.status(400).json({ error: "message is required" });
      return;
    }
    // context is optional — the widget is available site-wide now, and only
    // pages with an active sentence exercise (Sentence Building, Q&A) set it.
    const hasContext = typeof korean === "string" && Array.isArray(englishWords);
    const safeHistory = isValidHistory(history) ? history.slice(-10) : [];

    const reply = await chatAboutSentence(
      message.trim(),
      hasContext ? { korean, englishWords, formula: typeof formula === "string" ? formula : "" } : null,
      safeHistory,
      typeof locale === "string" ? locale : "uz",
    );
    res.json({ reply });
  } catch (err) {
    // This endpoint is learner-facing (not admin-only) — never leak raw
    // provider error details (e.g. Anthropic API error JSON) into the chat.
    console.error("sentenceChat failed:", err);
    const status = (err as { status?: number })?.status ?? 502;
    res.status(status).json({ error: "AI yordamchi hozircha javob bera olmadi. Birozdan keyin qayta urinib ko'ring." });
  }
};
