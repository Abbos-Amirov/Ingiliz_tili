import type { GrammarType, KeywordPos, Transform, VerbType } from "../../config/textbook";

// Authoring shape for a textbook lesson (mirrors models/TextbookLesson.ts).
// Keys must stay stable once published — learner progress references them.
export interface TransformCardSeed {
  transform: Transform;
  ruleKo: string;
  ruleUz: string;
  sentences: string[];
  noteKo?: string;
  noteUz?: string;
}

export interface TextbookLessonSeed {
  // Book level (Lv.0, Lv.1, ...) — see books.ts. Lesson numbers restart per book.
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
  keywords: { word: string; pronunciationKo: string; korean: string; uzbek: string; partOfSpeech: KeywordPos }[];
  verbTypes: { type: VerbType; meaningKo: string; meaningUz: string; examples: string[]; baseSentence: string }[];
  verbRuleKo: string;
  verbRuleUz: string;
  shapeTransforms: TransformCardSeed[];
  subjectTenseTransforms: TransformCardSeed[];
  imperative: {
    ruleKo: string;
    ruleUz: string;
    examples: string[];
    dontRuleKo: string;
    dontRuleUz: string;
    dontExample: string;
  };
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
  // Sections that not every lesson's pages have been provided for yet.
  selfTransform?: {
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
      given?: boolean;
    }[];
  }[];
  sentencePractice?: { key: string; english: string; pronunciationKo: string; korean: string; uzbek: string }[];
  freeTalk?: { key: string; question: string; pronunciationKo: string; meaningKo: string; meaningUz: string }[];
}
