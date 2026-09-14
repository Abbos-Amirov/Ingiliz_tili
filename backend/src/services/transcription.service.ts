import { execFile } from "child_process";
import { promisify } from "util";
import { mkdtemp, readFile, rm, stat } from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import { OPENAI_API_KEY } from "../config/env";

const execFileAsync = promisify(execFile);

// Word-level timestamps for the Shadowing feature (see
// shadowing.controller.ts) — OpenAI's transcription endpoint only returns
// these with `whisper-1` + response_format "verbose_json" +
// timestamp_granularities[]=word (the newer gpt-4o-*-transcribe models
// don't support word-level granularity). Chosen over running Whisper
// locally (the more common approach) so this app never needs Python/PyTorch
// installed on a small VPS — it already has this exact API key configured
// for tts.service.ts and voiceChat.service.ts.
const MODEL = "whisper-1";
// OpenAI's real, fixed 25MB cap on this endpoint — raising this number
// wouldn't do anything (it isn't a limit this app sets). What actually
// lets larger source videos through is sending only the audio track: a
// video's file size is dominated by its picture data, so a 64kbps mono
// speech-quality extraction of even a long clip stays a few MB.
const MAX_FILE_BYTES = 24 * 1024 * 1024;

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

async function extractAudio(videoPath: string, outDir: string): Promise<string> {
  const audioPath = path.join(outDir, "audio.mp3");
  await execFileAsync("ffmpeg", [
    "-i", videoPath,
    "-vn",
    "-acodec", "libmp3lame",
    "-ac", "1",
    "-b:a", "64k",
    "-y",
    audioPath,
  ]);
  return audioPath;
}

export async function transcribeVideoWordTimestamps(filePath: string): Promise<TranscriptWord[]> {
  if (!OPENAI_API_KEY) {
    throw Object.assign(new Error("OPENAI_API_KEY is not configured"), { status: 503 });
  }

  const tmpDir = await mkdtemp(path.join(tmpdir(), "shadowing-"));
  try {
    let audioPath: string;
    try {
      audioPath = await extractAudio(filePath, tmpDir);
    } catch (err) {
      throw Object.assign(new Error("Video fayldan audio ajratib bo'lmadi (ffmpeg xatosi)."), {
        status: 502,
        cause: err,
      });
    }

    const { size } = await stat(audioPath);
    if (size > MAX_FILE_BYTES) {
      throw Object.assign(
        new Error("Video juda uzun — ajratilgan audio 25MB'dan oshib ketdi. So'zlarni qo'lda kiriting."),
        { status: 413 },
      );
    }

    const buffer = await readFile(audioPath);
    const form = new FormData();
    form.append("file", new Blob([buffer], { type: "audio/mpeg" }), "audio.mp3");
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
  } finally {
    await rm(tmpDir, { recursive: true, force: true });
  }
}
