import { readFile, stat } from "fs/promises";
import path from "path";
import { OPENAI_API_KEY } from "../config/env";

// Word-level timestamps for the Shadowing feature (see
// shadowing.controller.ts) — OpenAI's transcription endpoint only returns
// these with `whisper-1` + response_format "verbose_json" +
// timestamp_granularities[]=word (the newer gpt-4o-*-transcribe models
// don't support word-level granularity). Chosen over running Whisper
// locally (the more common approach) so this app never needs Python/PyTorch
// installed on a small VPS — it already has this exact API key configured
// for tts.service.ts and voiceChat.service.ts.
const MODEL = "whisper-1";
const MAX_FILE_BYTES = 24 * 1024 * 1024; // OpenAI's transcription endpoint caps at 25MB

export interface TranscriptWord {
  word: string;
  startTime: number;
  endTime: number;
}

interface WhisperWordTimestamp {
  word: string;
  start: number;
  end: number;
}

interface WhisperVerboseResponse {
  words?: WhisperWordTimestamp[];
}

export async function transcribeVideoWordTimestamps(filePath: string): Promise<TranscriptWord[]> {
  if (!OPENAI_API_KEY) {
    throw Object.assign(new Error("OPENAI_API_KEY is not configured"), { status: 503 });
  }

  const { size } = await stat(filePath);
  if (size > MAX_FILE_BYTES) {
    throw Object.assign(
      new Error("Video fayl transkripsiya uchun juda katta (25MB dan oshmasligi kerak). Qo'lda kiriting."),
      { status: 413 },
    );
  }

  const buffer = await readFile(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const mimetype = ext === ".mov" ? "video/quicktime" : ext === ".webm" ? "video/webm" : "video/mp4";

  const form = new FormData();
  form.append("file", new Blob([buffer], { type: mimetype }), path.basename(filePath));
  form.append("model", MODEL);
  form.append("response_format", "verbose_json");
  form.append("timestamp_granularities[]", "word");

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: form,
  });

  if (!response.ok) {
    throw Object.assign(new Error(`OpenAI transcription failed (${response.status})`), { status: 502 });
  }

  const data = (await response.json()) as WhisperVerboseResponse;
  return (data.words ?? []).map((w) => ({
    word: w.word.trim(),
    startTime: w.start,
    endTime: w.end,
  }));
}
