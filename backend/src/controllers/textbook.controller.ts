import { RequestHandler } from "express";
import { Types } from "mongoose";
import { GrammarType, ROUND_SUBJECTS, Transform, VERB_TYPES, VerbType } from "../config/textbook";
import { MemoryAnchor } from "../models/MemoryAnchor";
import { TextbookLesson, TextbookLessonDoc } from "../models/TextbookLesson";
import { UserLessonProgress } from "../models/UserLessonProgress";
import { UserMistake } from "../models/UserMistake";
import { Word } from "../models/Word";
import { gradeStoryAnswer } from "../services/ai.service";
import {
  computeChecklist,
  fillPrompt,
  isBlankCorrect,
  lessonAudioMap,
  lessonSpeakableTexts,
} from "../services/textbook.service";

const VERB_TYPE_TO_GRAMMAR: Record<VerbType, GrammarType> = {
  be_verb: "be_verb",
  general_verb: "general_verb",
  modal_verb: "modal",
};

function transformToGrammar(transform: Transform, verbType: VerbType): GrammarType {
  return transform === "base" ? VERB_TYPE_TO_GRAMMAR[verbType] : transform;
}

const GRAMMAR_FOCUS_LABEL: Record<GrammarType, string> = {
  be_verb: "a basic sentence with a be-verb (am / is / are)",
  general_verb: "a basic sentence with a general (action) verb",
  modal: "a basic sentence with a modal verb (can / will / should) + base verb",
  negative: "a negative sentence (don't / doesn't / not)",
  question: "a yes/no question",
  wh_question: "a wh-question",
  subject: "a sentence with the given subject",
  past: "the simple past tense",
  future: "the future with will + base verb",
  continuous: "the present continuous (be + verb-ing)",
};

async function findLesson(lessonNumberParam: unknown) {
  const n = Number(lessonNumberParam);
  if (!Number.isInteger(n) || n < 1) return null;
  return TextbookLesson.findOne({ lessonNumber: n });
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Case-insensitive lookup of existing vocabulary Words for keywords, so a
// keyword can show whether it's already in the learner's Memory Palace.
export async function findWordsForKeywords(words: string[]) {
  if (words.length === 0) return new Map<string, Types.ObjectId>();
  const docs = await Word.find({
    $or: words.map((w) => ({ english: { $regex: `^${escapeRegex(w.trim())}$`, $options: "i" } })),
  })
    .select("_id english")
    .lean();
  const map = new Map<string, Types.ObjectId>();
  for (const d of docs) {
    const key = d.english.trim().toLowerCase();
    if (!map.has(key)) map.set(key, d._id);
  }
  return map;
}

// The lesson as sent to learners: puzzle answers are stripped (blanks are
// checked server-side, see checkPuzzle) — everything else is display content.
function publicLesson(lesson: TextbookLessonDoc) {
  return {
    _id: lesson._id,
    lessonNumber: lesson.lessonNumber,
    title: lesson.title,
    titleKo: lesson.titleKo,
    titleUz: lesson.titleUz,
    partOfSpeechGuide: lesson.partOfSpeechGuide,
    keywords: lesson.keywords,
    verbTypes: lesson.verbTypes,
    verbRuleKo: lesson.verbRuleKo,
    verbRuleUz: lesson.verbRuleUz,
    shapeTransforms: lesson.shapeTransforms,
    subjectTenseTransforms: lesson.subjectTenseTransforms,
    imperative: lesson.imperative,
    puzzles: lesson.puzzles.map((p) => ({
      verbType: p.verbType,
      baseSentence: p.baseSentence,
      baseMeaningKo: p.baseMeaningKo,
      baseMeaningUz: p.baseMeaningUz,
      pronunciationKo: p.pronunciationKo,
      rows: p.rows.map((r) => ({ key: r.key, transform: r.transform, prompt: r.prompt, hintKo: r.hintKo, hintUz: r.hintUz })),
    })),
    storyQuestions: lesson.storyQuestions,
    verbClassificationQuiz: lesson.verbClassificationQuiz,
  };
}

function progressSummary(
  lesson: Pick<TextbookLessonDoc, "puzzles" | "storyQuestions">,
  progress: { completedExercises: string[]; storyAnswers: { isCorrect: boolean }[] } | null,
) {
  const puzzleTotal = lesson.puzzles.reduce((sum, p) => sum + p.rows.length, 0);
  const storyTotal = lesson.storyQuestions.length * 3;
  return {
    puzzleDone: progress?.completedExercises.length ?? 0,
    puzzleTotal,
    storyDone: progress?.storyAnswers.filter((a) => a.isCorrect).length ?? 0,
    storyTotal,
  };
}

// GET /api/textbook/lessons
export const listTextbookLessons: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const lessons = await TextbookLesson.find().sort({ lessonNumber: 1 });
    const progresses = await UserLessonProgress.find({ userId, lessonId: { $in: lessons.map((l) => l._id) } }).lean();
    const byLesson = new Map(progresses.map((p) => [String(p.lessonId), p]));
    res.json({
      lessons: lessons.map((l) => ({
        _id: l._id,
        lessonNumber: l.lessonNumber,
        title: l.title,
        titleKo: l.titleKo,
        titleUz: l.titleUz,
        keywordCount: l.keywords.length,
        ...progressSummary(l, byLesson.get(String(l._id)) ?? null),
      })),
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/textbook/lessons/:lessonNumber
export const getTextbookLesson: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const lesson = await findLesson(req.params.lessonNumber);
    if (!lesson) {
      res.status(404).json({ error: "Lesson not found" });
      return;
    }
    const progress = await UserLessonProgress.findOne({ userId, lessonId: lesson._id }).lean();

    // Memory Palace status per keyword (spec item 4).
    const wordIds = await findWordsForKeywords(lesson.keywords.map((k) => k.word));
    const anchored = await MemoryAnchor.find({ userId, wordId: { $in: Array.from(wordIds.values()) } })
      .select("wordId")
      .lean();
    const anchoredSet = new Set(anchored.map((a) => String(a.wordId)));
    const keywordStatus: Record<string, { wordId: string | null; inPalace: boolean }> = {};
    for (const k of lesson.keywords) {
      const id = wordIds.get(k.word.trim().toLowerCase());
      keywordStatus[k.word] = { wordId: id ? String(id) : null, inPalace: id ? anchoredSet.has(String(id)) : false };
    }

    res.json({
      lesson: publicLesson(lesson),
      progress: {
        completedExercises: progress?.completedExercises ?? [],
        storyAnswers: progress?.storyAnswers ?? [],
        checklist: computeChecklist(progress),
        ...progressSummary(lesson, progress),
      },
      keywordStatus,
      audio: lessonAudioMap(lessonSpeakableTexts(lesson)),
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/textbook/lessons/:lessonNumber/puzzle-check  { rowKey, answer, reveal? }
// Checks one 오늘의 퍼즐 blank. A correct answer marks the row completed; a
// wrong one is logged as a UserMistake. `reveal: true` just returns the
// answer (a "show answer" button) without completing or logging anything.
export const checkPuzzle: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const { rowKey, answer, reveal } = req.body ?? {};
    const lesson = await findLesson(req.params.lessonNumber);
    if (!lesson) {
      res.status(404).json({ error: "Lesson not found" });
      return;
    }
    const puzzle = lesson.puzzles.find((p) => p.rows.some((r) => r.key === rowKey));
    const row = puzzle?.rows.find((r) => r.key === rowKey);
    if (!puzzle || !row) {
      res.status(400).json({ error: "Unknown puzzle row" });
      return;
    }
    if (reveal === true) {
      res.json({ isCorrect: false, correctAnswer: row.answers[0], sentence: fillPrompt(row.prompt, row.answers[0]) });
      return;
    }
    if (typeof answer !== "string" || answer.trim().length === 0 || answer.length > 100) {
      res.status(400).json({ error: "answer is required" });
      return;
    }

    const isCorrect = isBlankCorrect(answer, row.answers);
    if (isCorrect) {
      await UserLessonProgress.findOneAndUpdate(
        { userId, lessonId: lesson._id },
        { $addToSet: { completedExercises: row.key }, $set: { updatedAt: new Date() } },
        { upsert: true },
      );
    } else {
      await UserMistake.create({
        userId,
        lessonId: lesson._id,
        exerciseId: row.key,
        source: "puzzle",
        grammarType: transformToGrammar(row.transform as Transform, puzzle.verbType as VerbType),
        answer: answer.trim(),
        errorLocation: answer.trim(),
        errorExplanation: row.hintKo,
        errorExplanationUz: row.hintUz,
      });
    }
    // Show the book's spelling of the accepted answer the learner matched
    // ("Don’t" → "don't"), which is also the text the 🔊 clip was made for.
    const matched = isCorrect ? row.answers.find((a) => isBlankCorrect(answer, [a])) ?? row.answers[0] : null;
    res.json({
      isCorrect,
      correctAnswer: matched,
      sentence: matched ? fillPrompt(row.prompt, matched) : null,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/textbook/lessons/:lessonNumber/verb-quiz  { itemKey, selectedType }
export const checkVerbQuiz: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const { itemKey, selectedType } = req.body ?? {};
    const lesson = await findLesson(req.params.lessonNumber);
    if (!lesson) {
      res.status(404).json({ error: "Lesson not found" });
      return;
    }
    const item = lesson.verbClassificationQuiz.find((q) => q.key === itemKey);
    if (!item || !(VERB_TYPES as readonly string[]).includes(selectedType)) {
      res.status(400).json({ error: "Unknown quiz item or type" });
      return;
    }
    const isCorrect = selectedType === item.correctType;
    if (!isCorrect) {
      await UserMistake.create({
        userId,
        lessonId: lesson._id,
        exerciseId: item.key,
        source: "verb_quiz",
        grammarType: VERB_TYPE_TO_GRAMMAR[item.correctType as VerbType],
        answer: selectedType,
        errorLocation: item.word,
      });
    }
    res.json({ isCorrect, correctType: item.correctType });
  } catch (err) {
    next(err);
  }
};

// POST /api/textbook/check-answer
//   { lessonNumber (or lessonId), questionKey, round: 1|2|3, answer, koreanDraft? }
// AI-grades one Our Story answer, stores it as the latest answer for that
// (question, round) — which drives the auto checklist and round comparison —
// and logs a UserMistake when it's wrong.
export const checkStoryAnswer: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const { lessonNumber, lessonId, questionKey, round, answer, koreanDraft } = req.body ?? {};

    const lesson =
      lessonId && Types.ObjectId.isValid(lessonId)
        ? await TextbookLesson.findById(lessonId)
        : await findLesson(lessonNumber);
    if (!lesson) {
      res.status(404).json({ error: "Lesson not found" });
      return;
    }
    const question = lesson.storyQuestions.find((q) => q.key === questionKey);
    if (!question) {
      res.status(400).json({ error: "Unknown question" });
      return;
    }
    if (round !== 1 && round !== 2 && round !== 3) {
      res.status(400).json({ error: "round must be 1, 2 or 3" });
      return;
    }
    if (typeof answer !== "string" || answer.trim().length === 0 || answer.length > 300) {
      res.status(400).json({ error: "answer is required (max 300 characters)" });
      return;
    }
    const draft = typeof koreanDraft === "string" ? koreanDraft.trim().slice(0, 300) : "";

    // AI failures (bad key, rate limit, outage) become a clean 503 — the
    // client shows a friendly "try again shortly"; details stay in the log.
    let grade: Awaited<ReturnType<typeof gradeStoryAnswer>>;
    try {
      grade = await gradeStoryAnswer({
        question: question.question,
        questionMeaningKo: question.meaningKo,
        grammarFocus: GRAMMAR_FOCUS_LABEL[question.grammarType as GrammarType],
        subject: ROUND_SUBJECTS[round as 1 | 2 | 3],
        exampleAnswer: (question.examples as Record<string, string>)[round] ?? "",
        answer: answer.trim(),
        koreanDraft: draft || undefined,
      });
    } catch (err) {
      console.error("Story answer grading failed:", (err as Error).message);
      res.status(503).json({ error: "AI check is temporarily unavailable" });
      return;
    }

    // Replace any earlier answer for this (question, round) with the new one.
    const filter = { userId, lessonId: lesson._id };
    await UserLessonProgress.updateOne(
      filter,
      { $pull: { storyAnswers: { questionKey: question.key, round } } },
      { upsert: true },
    );
    const progress = await UserLessonProgress.findOneAndUpdate(
      filter,
      {
        $push: {
          storyAnswers: { questionKey: question.key, round, koreanDraft: draft, answer: answer.trim(), ...grade, checkedAt: new Date() },
        },
        $set: { updatedAt: new Date() },
      },
      { new: true },
    ).lean();

    if (!grade.isCorrect) {
      await UserMistake.create({
        userId,
        lessonId: lesson._id,
        exerciseId: question.key,
        source: "story",
        grammarType: question.grammarType,
        answer: answer.trim(),
        errorLocation: grade.errorLocation,
        errorExplanation: grade.explanationKo,
        errorExplanationUz: grade.explanationUz,
      });
    }

    res.json({
      result: grade,
      example: (question.examples as Record<string, string>)[round] ?? "",
      checklist: computeChecklist(progress),
      ...progressSummary(lesson, progress),
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/user/mistake-stats — mistakes per grammar point, most first.
export const mistakeStats: RequestHandler = async (req, res, next) => {
  try {
    const stats = await UserMistake.aggregate<{ _id: GrammarType; count: number }>([
      { $match: { userId: new Types.ObjectId(req.user!.id) } },
      { $group: { _id: "$grammarType", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    res.json(stats);
  } catch (err) {
    next(err);
  }
};
