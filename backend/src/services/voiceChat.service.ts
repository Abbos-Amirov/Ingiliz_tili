import { OPENAI_API_KEY } from "../config/env";

// Speech-to-text side of voice chat (see chat.controller.ts's voiceChat).
// No language is pinned — the learner may be practicing speaking in
// English, Korean, or Uzbek, and Whisper's auto-detection handles all
// three well enough to not need a locale-based hint.
const TRANSCRIBE_MODEL = "gpt-4o-mini-transcribe";

export async function transcribeSpeech(buffer: Buffer, filename: string, mimetype: string): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw Object.assign(new Error("OPENAI_API_KEY is not configured"), { status: 503 });
  }

  const form = new FormData();
  form.append("file", new Blob([buffer], { type: mimetype || "audio/webm" }), filename || "audio.webm");
  form.append("model", TRANSCRIBE_MODEL);

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: form,
  });

  if (!response.ok) {
    throw Object.assign(new Error(`OpenAI transcription failed (${response.status})`), { status: 502 });
  }

  const data = (await response.json()) as { text?: string };
  return (data.text ?? "").trim();
}
