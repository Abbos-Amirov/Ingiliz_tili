import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { OPENAI_API_KEY, PUBLIC_BASE_URL } from "../config/env";

// Auto-generates a word's pronunciation clips the moment it's created/edited
// in the admin panel (see words.controller.ts), so audio is ready
// immediately instead of waiting on the manual, macOS-only
// scripts/generateAudio.ts batch. Runs once per word text — the resulting
// .mp3 is saved here and served as a static file (see app.ts's `/audio`
// mount), so playback afterwards never calls OpenAI again. Failures are
// caught by the caller: a missing clip just falls back to the browser's
// speechSynthesis, and generateAudio.ts's idempotent backfill can pick up
// anything that failed here.
//
// Built from process.cwd() rather than __dirname: __dirname would point at
// dist/src/services in the compiled Docker image but src/services under
// `tsx watch` in dev, two different nesting depths. cwd is the backend
// project root in both (npm scripts run from there; the Docker WORKDIR is
// /app), so it stays correct either way — and matches the docker-compose
// bind mount at /app/public/audio.
const AUDIO_DIR = path.resolve(process.cwd(), "public/audio/words");
const MODEL = "gpt-4o-mini-tts";
const VOICE = "alloy";

async function synthesizeToFile(text: string, fileName: string): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw Object.assign(new Error("OPENAI_API_KEY is not configured"), { status: 503 });
  }

  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: MODEL, voice: VOICE, input: text, response_format: "mp3" }),
  });

  if (!response.ok) {
    throw Object.assign(new Error(`OpenAI TTS failed (${response.status})`), { status: 502 });
  }

  await mkdir(AUDIO_DIR, { recursive: true });
  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(path.join(AUDIO_DIR, fileName), buffer);
  return `${PUBLIC_BASE_URL}/audio/words/${fileName}`;
}

export async function generateWordAudio(
  wordId: string,
  english: string,
  korean: string,
): Promise<{ audioUrl: string; koreanAudioUrl: string }> {
  const [audioUrl, koreanAudioUrl] = await Promise.all([
    synthesizeToFile(english, `${wordId}-en.mp3`),
    synthesizeToFile(korean, `${wordId}-ko.mp3`),
  ]);
  return { audioUrl, koreanAudioUrl };
}
