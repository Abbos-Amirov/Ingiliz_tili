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
  audioUrl?: string | null;
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
  koreanAudioUrl?: string | null;
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
  audioUrl?: string | null;
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

export type IrregularVerbCategory =
  | "movement"
  | "thinking"
  | "feeling"
  | "communication"
  | "possession"
  | "other";

export interface IrregularVerb {
  _id: string;
  base: string;
  past: string;
  participle: string;
  korean: string;
  category: IrregularVerbCategory;
  frequency: number | null;
}

export interface GrammarUsageCase {
  uz: string;
  example: string;
}

export interface GrammarRelatedFormula {
  relatedTopicId: string;
  title: string;
  difference: string;
}

export interface GrammarCommonMistake {
  wrong: string;
  correct: string;
  explanation: string;
}

export interface GrammarExample {
  english: string;
  korean: string;
  uzbek: string;
}

export interface GrammarTopic {
  _id: string;
  title: { uz: string; en: string; ko: string };
  formula: string;
  level: Difficulty;
  order: number;
  ruleExplanation: { uz: string; en: string; ko: string };
  usageCases: GrammarUsageCase[];
  relatedFormulas: GrammarRelatedFormula[];
  commonMistakes: GrammarCommonMistake[];
  examples: GrammarExample[];
}

export interface GrammarTopicProgress {
  topicId: string;
  questionsCorrect: number;
  questionsTotal: number;
}
