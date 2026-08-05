export type Difficulty = "beginner" | "intermediate" | "advanced";
export type Role = "user" | "admin";

export type PartOfSpeech =
  | "noun"
  | "pronoun"
  | "verb"
  | "adjective"
  | "adverb"
  | "preposition"
  | "conjunction"
  | "article"
  | "interjection";

export type GrammarRole =
  | "subject"
  | "verb"
  | "auxiliary"
  | "object"
  | "adjective"
  | "adverb"
  | "preposition"
  | "conjunction"
  | "article"
  | "pronoun"
  | "interjection";

export interface RoleWord {
  text: string;
  role: GrammarRole;
}

export interface Word {
  _id: string;
  english: string;
  korean: string;
  exampleSentenceEn: string;
  exampleSentenceKo: string;
  category: string;
  difficulty: Difficulty;
  partOfSpeech?: PartOfSpeech | null;
  audioUrl?: string | null;
  imageUrl?: string | null;
  lessonNumber: number;
  lessonNumberEnd: number;
}

export interface Sentence {
  _id: string;
  korean: string;
  words: RoleWord[];
  distractorWords: RoleWord[];
  formula: string;
  level: Difficulty;
  lessonNumber: number;
  lessonNumberEnd: number;
}

export interface Lesson {
  lessonNumber: number;
  lessonNumberEnd: number;
  wordCount: number;
  sentenceCount: number;
}

export interface LevelDefinition {
  formulas: string[];
  activeRoles: GrammarRole[];
}

export type LevelConfig = Record<Difficulty, LevelDefinition>;

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: Role;
}

export interface UserStats {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  wordsLearnedToday: number;
  dailyGoal: number;
  totalWordsLearned: number;
}

export interface WordProgress {
  easeFactor: number;
  interval: number;
  repetitions: number;
  lapses: number;
  dueDate: string;
}
