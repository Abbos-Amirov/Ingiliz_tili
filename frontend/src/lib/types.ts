export type Difficulty = "beginner" | "intermediate" | "advanced";
export type Role = "user" | "admin";

export interface Word {
  _id: string;
  english: string;
  korean: string;
  exampleSentenceEn: string;
  exampleSentenceKo: string;
  category: string;
  difficulty: Difficulty;
  audioUrl?: string | null;
  imageUrl?: string | null;
  lessonNumber: number;
}

export interface Sentence {
  _id: string;
  korean: string;
  englishWords: string[];
  distractorWords: string[];
  level: Difficulty;
  lessonNumber: number;
}

export interface Lesson {
  lessonNumber: number;
  wordCount: number;
  sentenceCount: number;
}

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
