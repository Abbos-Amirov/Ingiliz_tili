import "dotenv/config";
import mongoose from "mongoose";
import { execFile } from "child_process";
import { promisify } from "util";
import { mkdir, rm } from "fs/promises";
import path from "path";
import { env } from "../src/config/env";
import { Word } from "../src/models/Word";
import { Sentence } from "../src/models/Sentence";

// One-time/occasional local generation step (uses macOS's built-in `say` +
// `afconvert`) — the resulting .m4a files are committed to
// frontend/public/audio and served as plain static assets. This exists
// because many in-app browsers (KakaoTalk, Instagram, ...) and Android
// WebView simply don't implement window.speechSynthesis, so pronunciation
// can't rely on it. Idempotent by default: only fills in words/sentences
// missing audio. Set FORCE_REGENERATE=1 to re-synthesize everything (e.g.
// after changing RATE/voice) — used once to slow the pace down for learners.

const execFileAsync = promisify(execFile);

const FRONTEND_PUBLIC = path.resolve(__dirname, "../../frontend/public");
const WORDS_DIR = path.join(FRONTEND_PUBLIC, "audio", "words");
const SENTENCES_DIR = path.join(FRONTEND_PUBLIC, "audio", "sentences");

const EN_VOICE = "Samantha";
const KO_VOICE = "Yuna";
// macOS `say` defaults to ~175-180 wpm; 160 is a touch slower and clearer
// for learners without sounding unnaturally slow.
const RATE = "160";
const FORCE = process.env.FORCE_REGENERATE === "1";

async function synthesize(text: string, voice: string, outPath: string) {
  const tmpAiff = outPath.replace(/\.m4a$/, ".aiff");
  await execFileAsync("say", ["-v", voice, "-r", RATE, "-o", tmpAiff, text]);
  await execFileAsync("afconvert", ["-f", "m4af", "-d", "aac", tmpAiff, outPath]);
  await rm(tmpAiff);
}

async function main() {
  await mongoose.connect(env.MONGODB_URI);
  console.log("Connected to MongoDB for audio generation");
  await mkdir(WORDS_DIR, { recursive: true });
  await mkdir(SENTENCES_DIR, { recursive: true });

  const words = await Word.find(
    FORCE ? {} : { $or: [{ audioUrl: null }, { koreanAudioUrl: null }] },
  );
  console.log(`Words needing audio: ${words.length}${FORCE ? " (forced regeneration)" : ""}`);
  let wCount = 0;
  for (const w of words) {
    const id = w._id.toString();
    let changed = false;
    if (FORCE || !w.audioUrl) {
      const file = path.join(WORDS_DIR, `${id}-en.m4a`);
      await synthesize(w.english, EN_VOICE, file);
      w.audioUrl = `/audio/words/${id}-en.m4a`;
      changed = true;
    }
    if (FORCE || !w.koreanAudioUrl) {
      const file = path.join(WORDS_DIR, `${id}-ko.m4a`);
      await synthesize(w.korean, KO_VOICE, file);
      w.koreanAudioUrl = `/audio/words/${id}-ko.m4a`;
      changed = true;
    }
    if (changed) {
      await w.save();
      wCount++;
      process.stdout.write(`\r  words done: ${wCount}/${words.length}`);
    }
  }
  console.log();

  const sentences = await Sentence.find(FORCE ? {} : { audioUrl: null });
  console.log(`Sentences needing audio: ${sentences.length}${FORCE ? " (forced regeneration)" : ""}`);
  let sCount = 0;
  for (const s of sentences) {
    const id = s._id.toString();
    const text = s.words.map((w) => w.text).join(" ");
    const file = path.join(SENTENCES_DIR, `${id}.m4a`);
    await synthesize(text, EN_VOICE, file);
    s.audioUrl = `/audio/sentences/${id}.m4a`;
    await s.save();
    sCount++;
    process.stdout.write(`\r  sentences done: ${sCount}/${sentences.length}`);
  }
  console.log();

  console.log("Done.");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Audio generation failed:", err);
  process.exit(1);
});
