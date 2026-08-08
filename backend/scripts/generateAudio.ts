import "dotenv/config";
import mongoose from "mongoose";
import { execFile } from "child_process";
import { promisify } from "util";
import { mkdir, rm } from "fs/promises";
import path from "path";
import { env } from "../src/config/env";
import { Word } from "../src/models/Word";
import { Sentence } from "../src/models/Sentence";
import { FunctionWord } from "../src/models/FunctionWord";

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
const TOKENS_DIR = path.join(FRONTEND_PUBLIC, "audio", "tokens");

const EN_VOICE = "Samantha";
const KO_VOICE = "Yuna";
// macOS `say` defaults to ~175-180 wpm; 160 is a touch slower and clearer
// for learners without sounding unnaturally slow.
const RATE = "160";
const FORCE = process.env.FORCE_REGENERATE === "1";

function normalize(text: string): string {
  return text.trim().toLowerCase();
}

function slug(text: string): string {
  const s = text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || Buffer.from(text).toString("hex").slice(0, 24);
}

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
  await mkdir(TOKENS_DIR, { recursive: true });

  const words = await Word.find(FORCE ? {} : { $or: [{ audioUrl: null }, { koreanAudioUrl: null }] });
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
  console.log(`Sentences needing full-sentence audio: ${sentences.length}${FORCE ? " (forced regeneration)" : ""}`);
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

  // Per-word audio, played when a learner taps a word while building a
  // sentence. Reuse an existing Word.audioUrl whenever the text matches a
  // dictionary word exactly (very common — "I", "a", "write", ...), and
  // reuse newly-generated clips across sentences too, so the same word is
  // never synthesized twice.
  const reuseCache = new Map<string, string>();
  const allWords = await Word.find({ audioUrl: { $ne: null } }, { english: 1, audioUrl: 1 });
  for (const w of allWords) {
    if (w.audioUrl) reuseCache.set(normalize(w.english), w.audioUrl);
  }

  const allSentences = await Sentence.find();
  let tCount = 0;
  let reused = 0;
  for (const s of allSentences) {
    let changed = false;
    for (const list of [s.words, s.distractorWords]) {
      for (const rw of list) {
        if (!FORCE && rw.audioUrl) continue;
        const key = normalize(rw.text);
        let url = reuseCache.get(key);
        if (!url || FORCE) {
          const file = path.join(TOKENS_DIR, `${slug(key)}.m4a`);
          await synthesize(rw.text, EN_VOICE, file);
          url = `/audio/tokens/${slug(key)}.m4a`;
          reuseCache.set(key, url);
          tCount++;
        } else {
          reused++;
        }
        rw.audioUrl = url;
        changed = true;
      }
    }
    if (changed) {
      s.markModified("words");
      s.markModified("distractorWords");
      await s.save();
      process.stdout.write(`\r  per-word audio: ${tCount} generated, ${reused} reused`);
    }
  }
  console.log();

  // Function Words glossary pronunciation (see FunctionWordModal's 🔊 button).
  const functionWords = await FunctionWord.find(FORCE ? {} : { audioUrl: null });
  console.log(`Function words needing audio: ${functionWords.length}${FORCE ? " (forced regeneration)" : ""}`);
  let fwCount = 0;
  for (const fw of functionWords) {
    const key = normalize(fw.word);
    let url = reuseCache.get(key);
    if (!url || FORCE) {
      const file = path.join(TOKENS_DIR, `${slug(key)}.m4a`);
      // A few glossary entries combine two forms (e.g. "how much / how
      // many") — speak that as "or" rather than the literal slash.
      await synthesize(fw.word.replace(/\s*\/\s*/g, " or "), EN_VOICE, file);
      url = `/audio/tokens/${slug(key)}.m4a`;
      reuseCache.set(key, url);
    }
    fw.audioUrl = url;
    await fw.save();
    fwCount++;
    process.stdout.write(`\r  function words done: ${fwCount}/${functionWords.length}`);
  }
  console.log();

  console.log("Done.");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Audio generation failed:", err);
  process.exit(1);
});
