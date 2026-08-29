import { RequestHandler } from "express";
import { chatAboutSentence, ChatMessage, SentenceChatContext } from "../services/ai.service";
import { transcribeSpeech } from "../services/voiceChat.service";
import { synthesizeSpeechBuffer } from "../services/tts.service";

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

function parseJsonField<T>(value: unknown, isValid: (parsed: unknown) => parsed is T): T | null {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const parsed = JSON.parse(value);
    return isValid(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function isSentenceContext(value: unknown): value is SentenceChatContext {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as SentenceChatContext).korean === "string" &&
    Array.isArray((value as SentenceChatContext).englishWords)
  );
}

// Speak-to-the-AI-tutor mode (see AiChatWidget's mic button): the learner
// records themselves speaking (Korean, Uzbek, or English), and gets back
// both a text reply and a spoken one — same tutor/context logic as the text
// endpoint above, with a transcription step in front and a TTS step behind.
export const voiceChat: RequestHandler = async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "audio file is required (field name: audio)" });
      return;
    }

    const transcript = await transcribeSpeech(req.file.buffer, req.file.originalname, req.file.mimetype);
    if (!transcript) {
      res.status(422).json({ error: "Ovozingiz aniqlanmadi. Birozdan keyin qayta urinib ko'ring." });
      return;
    }

    const context = parseJsonField(req.body?.context, isSentenceContext);
    const history = parseJsonField(req.body?.history, isValidHistory)?.slice(-10) ?? [];
    const locale = typeof req.body?.locale === "string" ? req.body.locale : "uz";

    const reply = await chatAboutSentence(transcript, context, history, locale);
    const audioBuffer = await synthesizeSpeechBuffer(reply);

    res.json({ transcript, reply, audioBase64: audioBuffer.toString("base64") });
  } catch (err) {
    console.error("voiceChat failed:", err);
    const status = (err as { status?: number })?.status ?? 502;
    res.status(status).json({ error: "AI yordamchi hozircha javob bera olmadi. Birozdan keyin qayta urinib ko'ring." });
  }
};
