import { createHash } from "crypto";
import { existsSync } from "fs";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { OPENAI_API_KEY, PUBLIC_BASE_URL } from "../config/env";
import { CHECKLIST_COLUMNS, ChecklistColumn } from "../config/textbook";
import { TEXTBOOK_LESSONS } from "../data/textbook";
import { TextbookLesson, TextbookLessonDoc } from "../models/TextbookLesson";
import type { UserLessonProgressDoc } from "../models/UserLessonProgress";
import { Word } from "../models/Word";
import { generateWordAudio, synthesizeSpeechBuffer } from "./tts.service";

// ─── Content sync ──────────────────────────────────────────────────────────

// Upserts every authored lesson (src/data/textbook) by (level, lessonNumber).
// Runs on server start; the _id of an existing lesson is kept, and exercises
// are keyed by stable strings, so learner progress survives content edits.
export async function syncTextbookLessons(): Promise<void> {
  // One-time migration from the single-book version: lessons saved before
  // books existed have no `level` (they're Lv.0), and the old unique index on
  // lessonNumber alone would block a Lv.1 "lesson 1". Both steps are no-ops
  // once applied.
  await TextbookLesson.updateMany({ level: { $exists: false } }, { $set: { level: 0 } });
  await TextbookLesson.collection.dropIndex("lessonNumber_1").catch(() => undefined);

  for (const seed of TEXTBOOK_LESSONS) {
    await TextbookLesson.findOneAndUpdate(
      { level: seed.level, lessonNumber: seed.lessonNumber },
      { ...seed, updatedAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true },
    );
  }
  await TextbookLesson.syncIndexes();
  console.log(`Textbook: synced ${TEXTBOOK_LESSONS.length} lesson(s)`);
  await ensureKeywordWords();
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Every textbook keyword should also exist in the app's vocabulary (Word),
// so it shows up in All Words, can be placed in the Memory Palace, etc.
// Keywords already in the vocabulary (matched case-insensitively) are left
// alone; missing ones are created from the lesson's own translations with
// category "textbook" and lesson 0 (kept out of the old word-lesson listing,
// see lessons.controller.ts), and get pronunciation clips in the background.
export async function ensureKeywordWords(): Promise<void> {
  const keywords = new Map<string, { word: string; korean: string; uzbek: string; partOfSpeech: string }>();
  for (const seed of TEXTBOOK_LESSONS) {
    for (const k of seed.keywords) keywords.set(k.word.trim().toLowerCase(), k);
  }
  if (keywords.size === 0) return;

  const existing = await Word.find({
    $or: Array.from(keywords.keys()).map((w) => ({ english: { $regex: `^${escapeRegex(w)}$`, $options: "i" } })),
  })
    .select("english")
    .lean();
  const have = new Set(existing.map((w) => w.english.trim().toLowerCase()));

  const created: { id: string; english: string; korean: string }[] = [];
  for (const [key, k] of keywords) {
    if (have.has(key)) continue;
    try {
      const doc = await Word.create({
        english: key,
        korean: k.korean,
        uzbek: k.uzbek,
        partOfSpeech: k.partOfSpeech,
        category: "textbook",
        lessonNumber: 0,
        lessonNumberEnd: 0,
      });
      created.push({ id: String(doc._id), english: doc.english, korean: doc.korean });
    } catch (err) {
      console.error(`Textbook keyword "${k.word}" could not be saved as a Word:`, (err as Error).message);
    }
  }
  if (created.length === 0) return;
  console.log(`Textbook: added ${created.length} keyword(s) to the vocabulary`);

  if (!OPENAI_API_KEY) return;
  // Same clips admin-created words get; best-effort, in the background.
  void (async () => {
    for (const w of created) {
      try {
        const urls = await generateWordAudio(w.id, w.english, w.korean);
        await Word.updateOne({ _id: w.id }, urls);
      } catch (err) {
        console.error(`Audio for keyword "${w.english}" failed:`, (err as Error).message);
      }
    }
  })();
}

// ─── Puzzle checking ───────────────────────────────────────────────────────

// Lenient comparison for typed blanks: case, curly apostrophes, extra spaces
// and trailing punctuation don't matter ("Don’t" == "don't").
export function normalizeBlank(text: string): string {
  return text
    .toLowerCase()
    .replace(/[‘’ʼ`]/g, "'")
    .replace(/[.!?,]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function isBlankCorrect(answer: string, accepted: string[]): boolean {
  const a = normalizeBlank(answer);
  return a.length > 0 && accepted.some((x) => normalizeBlank(x) === a);
}

// "I am ___ happy." + "not" → "I am not happy."
export function fillPrompt(prompt: string, answer: string): string {
  return prompt.replace("___", answer);
}

// ─── Auto-filled 문장 변형 체크 table ──────────────────────────────────────

export type Checklist = Record<1 | 2 | 3, Record<ChecklistColumn, boolean>>;

// One row per round, one column per CHECKLIST_COLUMNS entry. A cell is ticked
// only by a correct (AI-graded) Our Story answer in that round that actually
// uses the feature; "subject_change" is ticked by any correct answer in the
// She / He rounds. Learners cannot tick cells by hand.
export function computeChecklist(progress: Pick<UserLessonProgressDoc, "storyAnswers"> | null): Checklist {
  const empty = () =>
    Object.fromEntries(CHECKLIST_COLUMNS.map((c) => [c, false])) as Record<ChecklistColumn, boolean>;
  const checklist: Checklist = { 1: empty(), 2: empty(), 3: empty() };
  for (const a of progress?.storyAnswers ?? []) {
    if (!a.isCorrect) continue;
    const row = checklist[a.round as 1 | 2 | 3];
    if (!row) continue;
    for (const f of a.features) {
      if ((CHECKLIST_COLUMNS as readonly string[]).includes(f)) row[f as ChecklistColumn] = true;
    }
    if (a.round >= 2) row.subject_change = true;
  }
  return checklist;
}

// ─── Pronunciation audio ───────────────────────────────────────────────────

// Lesson text is voiced with the same OpenAI TTS the word clips use (see
// tts.service.ts) — the browser's speechSynthesis doesn't work in the
// Android app's WebView. Clips are content-addressed by text, generated in
// the background after sync, and served from the persisted /audio mount.
const AUDIO_DIR = path.resolve(process.cwd(), "public/audio/textbook");

function audioFileName(text: string): string {
  return `${createHash("sha1").update(text.trim()).digest("hex").slice(0, 20)}.mp3`;
}

// Every English string a learner can press 🔊 on.
export function lessonSpeakableTexts(lesson: Pick<TextbookLessonDoc, "keywords" | "shapeTransforms" | "subjectTenseTransforms" | "imperative" | "puzzles" | "storyQuestions" | "verbTypes">): string[] {
  const texts = new Set<string>();
  for (const k of lesson.keywords) texts.add(k.word);
  for (const v of lesson.verbTypes) texts.add(v.baseSentence);
  for (const card of [...lesson.shapeTransforms, ...lesson.subjectTenseTransforms]) {
    for (const s of card.sentences) texts.add(s);
  }
  if (lesson.imperative) {
    for (const s of lesson.imperative.examples ?? []) texts.add(s);
    if (lesson.imperative.dontExample) texts.add(lesson.imperative.dontExample);
  }
  for (const p of lesson.puzzles) {
    texts.add(p.baseSentence);
    for (const r of p.rows) texts.add(fillPrompt(r.prompt, r.answers[0]));
  }
  for (const q of lesson.storyQuestions) {
    texts.add(q.question);
    for (const round of [1, 2, 3] as const) {
      const ex = (q.examples as Record<string, string | undefined>)[round];
      if (ex) texts.add(ex);
    }
  }
  return Array.from(texts).filter((t) => t.trim().length > 0);
}

// text → URL, for clips that already exist on disk (the rest fall back to
// speechSynthesis on the client until the background job catches up).
export function lessonAudioMap(texts: string[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const t of texts) {
    const file = audioFileName(t);
    if (existsSync(path.join(AUDIO_DIR, file))) map[t] = `${PUBLIC_BASE_URL}/audio/textbook/${file}`;
  }
  return map;
}

// Generates any missing clips, a few at a time. Fire-and-forget from server
// start; failures are logged and retried on the next start.
export async function generateMissingLessonAudio(): Promise<void> {
  if (!OPENAI_API_KEY) {
    console.log("Textbook audio: OPENAI_API_KEY not set, skipping (clients fall back to speechSynthesis)");
    return;
  }
  await mkdir(AUDIO_DIR, { recursive: true });
  const lessons = await TextbookLesson.find().lean();
  const missing = Array.from(new Set(lessons.flatMap((l) => lessonSpeakableTexts(l)))).filter(
    (t) => !existsSync(path.join(AUDIO_DIR, audioFileName(t))),
  );
  if (missing.length === 0) return;
  console.log(`Textbook audio: generating ${missing.length} clip(s)`);
  let failed = 0;
  const CONCURRENCY = 3;
  for (let i = 0; i < missing.length; i += CONCURRENCY) {
    await Promise.all(
      missing.slice(i, i + CONCURRENCY).map(async (text) => {
        try {
          const buffer = await synthesizeSpeechBuffer(text);
          await writeFile(path.join(AUDIO_DIR, audioFileName(text)), buffer);
        } catch (err) {
          failed++;
          console.error(`Textbook audio failed for "${text}":`, (err as Error).message);
        }
      }),
    );
  }
  console.log(`Textbook audio: done (${missing.length - failed} ok, ${failed} failed)`);
}
