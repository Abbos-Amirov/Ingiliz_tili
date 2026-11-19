import { randomUUID } from "crypto";
import { RequestHandler } from "express";
import { Types } from "mongoose";
import { TextbookBook } from "../models/TextbookBook";
import { TextbookLesson } from "../models/TextbookLesson";
import { UserLessonProgress } from "../models/UserLessonProgress";
import { UserMistake } from "../models/UserMistake";
import { ImportImage, importLessonFromImages } from "../services/textbookImport.service";
import { ensureLessonKeys, refreshLessonSideEffects } from "../services/textbook.service";
import { BOOK_LIST_FIELDS, publicBook } from "./textbook.controller";

// Admin "Textbooks" page: books (title, subtitle, cover), their lessons
// (draft / published), AI import of a lesson from page photos, and the
// lesson editor. Mounted under /api/admin/textbook (admin only).

const httpError = (status: number, message: string) => Object.assign(new Error(message), { status });

function parseLevel(v: unknown): number | null {
  const n = Number(v);
  return Number.isInteger(n) && n >= 0 && n <= 50 ? n : null;
}
function parseLessonNumber(v: unknown): number | null {
  const n = Number(v);
  return Number.isInteger(n) && n >= 1 && n <= 500 ? n : null;
}

const keyPrefix = (level: number, lessonNumber: number) => `B${level}L${lessonNumber}`;

// ─── AI import jobs ────────────────────────────────────────────────────────
// An import takes a few minutes (Opus reads every page), longer than an HTTP
// request should stay open — so POST /import starts a job and the page polls
// GET /import/:id. Jobs live in memory: a server restart mid-import loses the
// job (the admin just runs it again); finished results are in the database.

interface ImportJob {
  id: string;
  level: number;
  lessonNumber: number;
  pages: number;
  status: "running" | "done" | "failed";
  startedAt: Date;
  finishedAt: Date | null;
  lessonId: string | null;
  error: string | null;
}
const jobs = new Map<string, ImportJob>();

function pruneJobs() {
  const cutoff = Date.now() - 6 * 3_600_000;
  for (const [id, job] of jobs) if (job.finishedAt && job.finishedAt.getTime() < cutoff) jobs.delete(id);
}

function runningJobFor(level: number, lessonNumber: number) {
  return [...jobs.values()].find((j) => j.status === "running" && j.level === level && j.lessonNumber === lessonNumber);
}

// Reference charts every lesson shares (book pages: parts of speech, verb
// chart, transformation overview). The AI doesn't re-read them — the draft
// copies them from the closest earlier lesson (editable in the admin).
const SHARED_FIELDS = [
  "partOfSpeechGuide",
  "verbTypes",
  "verbRuleKo",
  "verbRuleUz",
  "shapeTransforms",
  "subjectTenseTransforms",
  "imperative",
] as const;

function isEmpty(v: unknown): boolean {
  if (v == null) return true;
  if (typeof v === "string") return !v.trim();
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === "object") return Object.values(v as Record<string, unknown>).every(isEmpty);
  return false;
}

async function runImport(job: ImportJob, images: ImportImage[]) {
  try {
    const result = await importLessonFromImages(images, { level: job.level, lessonNumber: job.lessonNumber });
    const lesson: Record<string, unknown> = { ...result.lesson };

    const hasShared = { "verbTypes.0": { $exists: true } };
    const template =
      (await TextbookLesson.findOne({ ...hasShared, level: job.level, lessonNumber: { $lt: job.lessonNumber } })
        .sort({ lessonNumber: -1 })
        .lean()) ??
      (await TextbookLesson.findOne(hasShared).sort({ level: -1, lessonNumber: -1 }).lean());
    if (template) {
      for (const f of SHARED_FIELDS) if (isEmpty(lesson[f]) && !isEmpty(template[f])) lesson[f] = template[f];
    }

    ensureLessonKeys(lesson, keyPrefix(job.level, job.lessonNumber));
    const warnings = [...result.warnings];
    if (!template) {
      warnings.push({ path: "shared", note: "Umumiy jadvallar (so'z turkumlari, fe'l jadvali) uchun namuna dars topilmadi." });
    }

    const exists = await TextbookLesson.exists({ level: job.level, lessonNumber: job.lessonNumber });
    if (exists) throw httpError(409, `Lesson ${job.lessonNumber} already exists in Lv.${job.level}.`);

    const doc = await TextbookLesson.create({
      ...lesson,
      level: job.level,
      lessonNumber: job.lessonNumber,
      status: "draft",
      source: "ai",
      aiWarnings: warnings,
      aiUsage: { ...result.usage, createdAt: new Date() },
      updatedAt: new Date(),
    });
    job.lessonId = String(doc._id);
    job.status = "done";
    console.log(
      `Textbook AI import Lv.${job.level} L${job.lessonNumber}: ${result.usage.inputTokens} in / ${result.usage.outputTokens} out tokens, ~$${result.usage.usd}`,
    );
  } catch (err) {
    job.status = "failed";
    job.error = (err as Error).message || "Import failed";
    console.error(`Textbook AI import Lv.${job.level} L${job.lessonNumber} failed:`, job.error);
  } finally {
    job.finishedAt = new Date();
  }
}

// POST /api/admin/textbook/import  (multipart: images[], level, lessonNumber)
export const startImport: RequestHandler = async (req, res, next) => {
  try {
    pruneJobs();
    const level = parseLevel(req.body.level);
    const lessonNumber = parseLessonNumber(req.body.lessonNumber);
    if (level === null || lessonNumber === null) throw httpError(400, "Choose a book and a lesson number.");
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    if (files.length === 0) throw httpError(400, "Add at least one page photo.");
    if (!(await TextbookBook.exists({ level }))) throw httpError(404, "Book not found.");
    if (await TextbookLesson.exists({ level, lessonNumber })) {
      throw httpError(409, `Lesson ${lessonNumber} already exists in this book. Delete it first or pick another number.`);
    }
    if (runningJobFor(level, lessonNumber)) throw httpError(409, "This lesson is already being imported.");

    const job: ImportJob = {
      id: randomUUID(),
      level,
      lessonNumber,
      pages: files.length,
      status: "running",
      startedAt: new Date(),
      finishedAt: null,
      lessonId: null,
      error: null,
    };
    jobs.set(job.id, job);
    void runImport(
      job,
      files.map((f) => ({ data: f.buffer, mediaType: f.mimetype as ImportImage["mediaType"] })),
    );
    res.status(202).json({ job });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/textbook/import/:id
export const importStatus: RequestHandler = (req, res) => {
  const job = jobs.get(String(req.params.id));
  if (!job) {
    res.status(404).json({ error: "Import not found (the server may have restarted). Please start it again." });
    return;
  }
  res.json({ job });
};

// ─── Books ─────────────────────────────────────────────────────────────────

// GET /api/admin/textbook/books — every book with all its lessons (drafts too).
export const listBooks: RequestHandler = async (_req, res, next) => {
  try {
    const [books, lessons] = await Promise.all([
      TextbookBook.find().select(BOOK_LIST_FIELDS).sort({ level: 1 }).lean(),
      TextbookLesson.find()
        .select("level lessonNumber title titleKo titleUz status source aiWarnings aiUsage updatedAt keywords puzzles storyQuestions")
        .sort({ level: 1, lessonNumber: 1 })
        .lean(),
    ]);
    const running = [...jobs.values()].filter((j) => j.status === "running");
    res.json({
      books: books.map((b) => ({
        ...publicBook(b),
        lessons: lessons
          .filter((l) => l.level === b.level)
          .map((l) => ({
            _id: l._id,
            lessonNumber: l.lessonNumber,
            title: l.title,
            titleKo: l.titleKo,
            titleUz: l.titleUz,
            status: l.status ?? "published",
            source: l.source ?? "seed",
            warnings: l.aiWarnings?.length ?? 0,
            usd: l.aiUsage?.usd ?? null,
            counts: {
              keywords: l.keywords?.length ?? 0,
              puzzles: (l.puzzles ?? []).reduce((n, p) => n + (p.rows?.length ?? 0), 0),
              questions: l.storyQuestions?.length ?? 0,
            },
            updatedAt: l.updatedAt,
          })),
        importing: running.filter((j) => j.level === b.level),
      })),
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/textbook/books { level, title, subtitle }
export const createBook: RequestHandler = async (req, res, next) => {
  try {
    const level = parseLevel(req.body.level);
    const title = String(req.body.title ?? "").trim();
    if (level === null || !title) throw httpError(400, "Level and title are required.");
    if (await TextbookBook.exists({ level })) throw httpError(409, `Lv.${level} already exists.`);
    const book = await TextbookBook.create({
      level,
      title,
      subtitle: String(req.body.subtitle ?? "").trim(),
      updatedAt: new Date(),
    });
    res.status(201).json({ book: publicBook(book) });
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/textbook/books/:level { title, subtitle }
export const updateBook: RequestHandler = async (req, res, next) => {
  try {
    const level = parseLevel(req.params.level);
    const title = String(req.body.title ?? "").trim();
    if (level === null || !title) throw httpError(400, "Title is required.");
    const book = await TextbookBook.findOneAndUpdate(
      { level },
      { $set: { title, subtitle: String(req.body.subtitle ?? "").trim(), updatedAt: new Date() } },
      { new: true, projection: BOOK_LIST_FIELDS },
    );
    if (!book) throw httpError(404, "Book not found.");
    res.json({ book: publicBook(book) });
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/textbook/books/:level/cover (multipart: image)
export const uploadBookCover: RequestHandler = async (req, res, next) => {
  try {
    const level = parseLevel(req.params.level);
    const file = req.file;
    if (level === null) throw httpError(400, "Invalid level.");
    if (!file) throw httpError(400, "Choose an image.");
    if (file.size > 2 * 1024 * 1024) throw httpError(400, "The cover must be under 2 MB.");
    const book = await TextbookBook.findOneAndUpdate(
      { level },
      { $set: { coverImage: { data: file.buffer, contentType: file.mimetype }, updatedAt: new Date() } },
      { new: true, projection: BOOK_LIST_FIELDS },
    );
    if (!book) throw httpError(404, "Book not found.");
    res.json({ book: publicBook(book) });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/admin/textbook/books/:level — only an empty book.
export const deleteBook: RequestHandler = async (req, res, next) => {
  try {
    const level = parseLevel(req.params.level);
    if (level === null) throw httpError(400, "Invalid level.");
    if (await TextbookLesson.exists({ level })) throw httpError(409, "Delete this book's lessons first.");
    await TextbookBook.deleteOne({ level });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

// ─── Lessons ───────────────────────────────────────────────────────────────

async function lessonById(id: unknown) {
  if (!Types.ObjectId.isValid(String(id))) throw httpError(404, "Lesson not found.");
  const lesson = await TextbookLesson.findById(String(id));
  if (!lesson) throw httpError(404, "Lesson not found.");
  return lesson;
}

// GET /api/admin/textbook/lessons/:id — full content including answers.
export const getLesson: RequestHandler = async (req, res, next) => {
  try {
    const lesson = await lessonById(req.params.id);
    res.json({ lesson });
  } catch (err) {
    next(err);
  }
};

const EDITABLE_FIELDS = [
  "lessonNumber",
  "title",
  "titleKo",
  "titleUz",
  "keywords",
  "partOfSpeechGuide",
  "verbTypes",
  "verbRuleKo",
  "verbRuleUz",
  "shapeTransforms",
  "subjectTenseTransforms",
  "imperative",
  "puzzles",
  "storyQuestions",
  "verbClassificationQuiz",
  "selfTransform",
  "sentencePractice",
  "freeTalk",
  "aiWarnings",
] as const;

// PUT /api/admin/textbook/lessons/:id — save the whole edited lesson.
export const updateLesson: RequestHandler = async (req, res, next) => {
  try {
    const lesson = await lessonById(req.params.id);
    const body = req.body as Record<string, unknown>;
    const update: Record<string, unknown> = {};
    for (const f of EDITABLE_FIELDS) if (f in body) update[f] = body[f];

    if ("lessonNumber" in update) {
      const n = parseLessonNumber(update.lessonNumber);
      if (n === null) throw httpError(400, "Invalid lesson number.");
      update.lessonNumber = n;
      if (n !== lesson.lessonNumber && (await TextbookLesson.exists({ level: lesson.level, lessonNumber: n }))) {
        throw httpError(409, `Lesson ${n} already exists in this book.`);
      }
    }
    ensureLessonKeys(update, keyPrefix(lesson.level, (update.lessonNumber as number) ?? lesson.lessonNumber));

    lesson.set({ ...update, source: lesson.source === "seed" ? "admin" : lesson.source, updatedAt: new Date() });
    try {
      await lesson.validate();
    } catch (err) {
      throw httpError(400, `Some required fields are empty: ${(err as Error).message.replace(/^.*?validation failed: /, "")}`);
    }
    await lesson.save();
    if (lesson.status === "published") refreshLessonSideEffects();
    res.json({ lesson });
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/textbook/lessons/:id/publish { publish: boolean }
export const publishLesson: RequestHandler = async (req, res, next) => {
  try {
    const lesson = await lessonById(req.params.id);
    const publish = req.body.publish !== false;
    if (publish) {
      const missing: string[] = [];
      if (!lesson.title?.trim()) missing.push("title");
      if (!lesson.keywords?.length) missing.push("keywords");
      if (!lesson.storyQuestions?.length && !lesson.puzzles?.length) missing.push("exercises");
      if (missing.length) throw httpError(400, `The lesson is not ready to publish (missing: ${missing.join(", ")}).`);
    }
    lesson.status = publish ? "published" : "draft";
    lesson.updatedAt = new Date();
    await lesson.save();
    if (publish) refreshLessonSideEffects();
    res.json({ lesson });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/admin/textbook/lessons/:id — also removes learners' progress
// and mistakes recorded on it (they point at its exercise keys).
export const deleteLesson: RequestHandler = async (req, res, next) => {
  try {
    const lesson = await lessonById(req.params.id);
    await Promise.all([
      UserLessonProgress.deleteMany({ lessonId: lesson._id }),
      UserMistake.deleteMany({ lessonId: lesson._id }),
    ]);
    await lesson.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};
