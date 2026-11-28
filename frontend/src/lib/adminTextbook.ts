import type { GrammarType, KeywordPos, Transform, VerbType } from "./textbook";

// Admin "Textbooks" API shapes — mirror backend
// controllers/adminTextbook.controller.ts and models/TextbookLesson.ts.

export interface AdminLessonSummary {
  _id: string;
  lessonNumber: number;
  title: string;
  titleKo: string;
  titleUz: string;
  status: "draft" | "published";
  source: "seed" | "ai" | "admin";
  warnings: number;
  usd: number | null;
  counts: { keywords: number; puzzles: number; questions: number };
  updatedAt: string;
}

export interface ImportJob {
  id: string;
  level: number;
  lessonNumber: number;
  pages: number;
  status: "running" | "done" | "failed";
  startedAt: string;
  finishedAt: string | null;
  lessonId: string | null;
  error: string | null;
}

export interface AdminBook {
  level: number;
  title: string;
  subtitle: string;
  coverUrl: string | null;
  lessons: AdminLessonSummary[];
  importing: ImportJob[];
}

export interface AdminLesson {
  _id: string;
  level: number;
  lessonNumber: number;
  title: string;
  titleKo: string;
  titleUz: string;
  status: "draft" | "published";
  source: "seed" | "ai" | "admin";
  videoUrl?: string;
  keywords: { word: string; pronunciationKo: string; korean: string; uzbek: string; partOfSpeech: KeywordPos }[];
  puzzles: {
    verbType: VerbType;
    baseSentence: string;
    baseMeaningKo: string;
    baseMeaningUz: string;
    pronunciationKo: string;
    rows: { key: string; transform: Transform; prompt: string; answers: string[]; hintKo: string; hintUz: string }[];
  }[];
  storyQuestions: {
    key: string;
    question: string;
    pronunciationKo: string;
    meaningKo: string;
    meaningUz: string;
    grammarType: GrammarType;
    examples: { 1: string; 2: string; 3: string };
  }[];
  verbClassificationQuiz: { key: string; word: string; correctType: VerbType; exampleSentence: string }[];
  selfTransform: {
    key: string;
    titleKo: string;
    titleUz: string;
    rows: {
      key: string;
      labelKo: string;
      labelUz: string;
      promptKo: string;
      promptUz: string;
      answers: string[];
      grammarType: GrammarType;
      given: boolean;
    }[];
  }[];
  sentencePractice: { key: string; english: string; pronunciationKo: string; korean: string; uzbek: string }[];
  freeTalk: { key: string; question: string; pronunciationKo: string; meaningKo: string; meaningUz: string }[];
  verbTypes: unknown[];
  shapeTransforms: unknown[];
  subjectTenseTransforms: unknown[];
  aiWarnings: { path: string; note: string }[];
  aiUsage: { model: string; inputTokens: number; outputTokens: number; usd: number; createdAt: string } | null;
  updatedAt: string;
}

export const KEYWORD_POS: KeywordPos[] = ["noun", "verb", "adjective"];
export const VERB_TYPES: VerbType[] = ["be_verb", "general_verb", "modal_verb"];
export const TRANSFORMS: Transform[] = [
  "base",
  "negative",
  "question",
  "wh_question",
  "subject",
  "past",
  "future",
  "continuous",
  "imperative",
];
export const GRAMMAR_TYPES: GrammarType[] = [
  "be_verb",
  "general_verb",
  "modal",
  "negative",
  "question",
  "wh_question",
  "subject",
  "past",
  "future",
  "continuous",
  "imperative",
];
