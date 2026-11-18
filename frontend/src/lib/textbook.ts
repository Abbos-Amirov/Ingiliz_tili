import type { Locale } from "./i18n/translations";
import { isUzbekContentLocale } from "./contentLocale";

// Types for the Pallo! textbook feature — mirror backend
// models/TextbookLesson.ts and controllers/textbook.controller.ts.

export type VerbType = "be_verb" | "general_verb" | "modal_verb";
export type Transform =
  | "base"
  | "negative"
  | "question"
  | "wh_question"
  | "subject"
  | "past"
  | "future"
  | "continuous"
  | "imperative";
export type GrammarType =
  | "be_verb"
  | "general_verb"
  | "modal"
  | "negative"
  | "question"
  | "wh_question"
  | "subject"
  | "past"
  | "future"
  | "continuous"
  | "imperative";
export type KeywordPos = "noun" | "verb" | "adjective";
export type Round = 1 | 2 | 3;

export const CHECKLIST_COLUMNS = [
  "be_verb",
  "general_verb",
  "modal_verb",
  "negative",
  "question",
  "wh_question",
  "past",
  "future",
  "continuous",
  "subject_change",
  "imperative",
] as const;
export type ChecklistColumn = (typeof CHECKLIST_COLUMNS)[number];
export type Checklist = Record<Round, Record<ChecklistColumn, boolean>>;

export const ROUND_SUBJECTS: Record<Round, "I" | "She" | "He"> = { 1: "I", 2: "She", 3: "He" };

export interface TextbookKeyword {
  word: string;
  pronunciationKo: string;
  korean: string;
  uzbek: string;
  partOfSpeech: KeywordPos;
}

export interface TransformCard {
  transform: Transform;
  ruleKo: string;
  ruleUz: string;
  sentences: string[];
  noteKo: string;
  noteUz: string;
}

export interface PuzzleRow {
  key: string;
  transform: Transform;
  prompt: string;
  hintKo: string;
  hintUz: string;
}

export interface Puzzle {
  verbType: VerbType;
  baseSentence: string;
  baseMeaningKo: string;
  baseMeaningUz: string;
  pronunciationKo: string;
  rows: PuzzleRow[];
}

export interface StoryQuestion {
  key: string;
  question: string;
  pronunciationKo: string;
  meaningKo: string;
  meaningUz: string;
  grammarType: GrammarType;
  examples: Record<Round, string>;
}

export interface VerbQuizItem {
  key: string;
  word: string;
  correctType: VerbType;
  exampleSentence: string;
}

export interface TextbookLesson {
  _id: string;
  level: number;
  lessonNumber: number;
  title: string;
  titleKo: string;
  titleUz: string;
  partOfSpeechGuide: {
    partOfSpeech: KeywordPos;
    descriptionKo: string;
    descriptionUz: string;
    exampleKo: string;
    exampleUz: string;
  }[];
  keywords: TextbookKeyword[];
  verbTypes: { type: VerbType; meaningKo: string; meaningUz: string; examples: string[]; baseSentence: string }[];
  verbRuleKo: string;
  verbRuleUz: string;
  shapeTransforms: TransformCard[];
  subjectTenseTransforms: TransformCard[];
  imperative: {
    ruleKo: string;
    ruleUz: string;
    examples: string[];
    dontRuleKo: string;
    dontRuleUz: string;
    dontExample: string;
  } | null;
  puzzles: Puzzle[];
  storyQuestions: StoryQuestion[];
  verbClassificationQuiz: VerbQuizItem[];
  selfTransform: SelfTransformBlock[];
  sentencePractice: PracticeSentence[];
  freeTalk: FreeTalkQuestion[];
}

// 스스로 변형하기 — answers stay on the server except for the worked example.
export interface SelfTransformRow {
  key: string;
  labelKo: string;
  labelUz: string;
  promptKo: string;
  promptUz: string;
  given: boolean;
  answer: string | null;
}

export interface SelfTransformBlock {
  key: string;
  titleKo: string;
  titleUz: string;
  rows: SelfTransformRow[];
}

export interface PracticeSentence {
  key: string;
  english: string;
  pronunciationKo: string;
  korean: string;
  uzbek: string;
}

export interface FreeTalkQuestion {
  key: string;
  question: string;
  pronunciationKo: string;
  meaningKo: string;
  meaningUz: string;
}

export interface StoryAnswer {
  questionKey: string;
  round: Round;
  koreanDraft: string;
  answer: string;
  isCorrect: boolean;
  correctedSentence: string;
  errorLocation: string;
  explanationKo: string;
  explanationUz: string;
  features: string[];
  checkedAt: string;
}

export interface ProgressCounts {
  puzzleDone: number;
  puzzleTotal: number;
  drillDone: number;
  drillTotal: number;
  storyDone: number;
  storyTotal: number;
}

export interface LessonProgress extends ProgressCounts {
  completedExercises: string[];
  storyAnswers: StoryAnswer[];
  checklist: Checklist;
}

export interface TextbookLessonResponse {
  lesson: TextbookLesson;
  progress: LessonProgress;
  audio: Record<string, string>;
}

export interface TextbookLessonSummary extends ProgressCounts {
  _id: string;
  level: number;
  lessonNumber: number;
  title: string;
  titleKo: string;
  titleUz: string;
  keywordCount: number;
}

// One book of the series (Lv.0, Lv.1, ...) — see backend data/textbook/books.ts.
export interface TextbookBook {
  level: number;
  title: string;
  subtitle: string;
  coverUrl: string | null;
}

export interface TextbookBookSummary extends TextbookBook {
  lessonCount: number;
  available: boolean;
  done: number;
  total: number;
}

export interface StoryGrade {
  isCorrect: boolean;
  correctedSentence: string;
  errorLocation: string;
  explanationKo: string;
  explanationUz: string;
  features: string[];
}

export interface MistakeStat {
  _id: GrammarType;
  count: number;
}

// Learner-facing content follows the same rule as the rest of the app (see
// contentLocale.ts): Uzbek on the "uz" locale, the book's Korean otherwise.
export function pick(locale: Locale, ko: string | undefined, uz: string | undefined): string {
  return isUzbekContentLocale(locale) ? uz || ko || "" : ko || "";
}

// Word-level diff for the I / She / He comparison: marks the words of `b`
// that differ from the word at the same position in `a` — good enough for
// these short, same-shaped sentences ("I don't eat" → "She doesn't eat"
// marks She + doesn't).
export function diffWords(a: string, b: string): { word: string; changed: boolean }[] {
  const norm = (w: string) => w.toLowerCase().replace(/[.,!?]/g, "");
  const aw = a.trim().split(/\s+/);
  return b
    .trim()
    .split(/\s+/)
    .map((word, i) => ({ word, changed: norm(aw[i] ?? "") !== norm(word) }));
}
