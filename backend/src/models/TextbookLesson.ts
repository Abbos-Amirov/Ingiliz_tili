import { Schema, model, InferSchemaType, Types } from "mongoose";
import { GRAMMAR_TYPES, KEYWORD_POS, TRANSFORMS, VERB_TYPES } from "../config/textbook";

// One lesson (과) of the Pallo! textbook. Content is authored in
// src/data/textbook/*.ts and upserted on server start (see
// textbook.service.ts syncTextbookLessons) — there is no admin editor yet.
//
// Every exercise carries a stable string `key` (e.g. "L1-Q3") instead of
// relying on Mongo _ids, so re-syncing edited content never orphans a
// learner's saved progress (UserLessonProgress / UserMistake point at keys).
//
// Learner-facing text exists in Korean (from the book) and Uzbek (this app's
// second content language — see frontend/src/lib/contentLocale.ts).

const keywordSchema = new Schema(
  {
    word: { type: String, required: true },
    pronunciationKo: { type: String, default: "" },
    korean: { type: String, required: true },
    uzbek: { type: String, required: true },
    partOfSpeech: { type: String, enum: KEYWORD_POS, required: true },
  },
  { _id: false },
);

// "동사 한눈에 보기" — one row per verb family.
const verbTypeSchema = new Schema(
  {
    type: { type: String, enum: VERB_TYPES, required: true },
    meaningKo: { type: String, required: true },
    meaningUz: { type: String, required: true },
    examples: { type: [String], default: [] },
    baseSentence: { type: String, required: true },
  },
  { _id: false },
);

// "변형 한눈에 보기" — one card per transformation, holding the same base
// sentences transformed (I am happy. → I am not happy. → ...).
const transformCardSchema = new Schema(
  {
    transform: { type: String, enum: TRANSFORMS, required: true },
    ruleKo: { type: String, default: "" },
    ruleUz: { type: String, default: "" },
    sentences: { type: [String], default: [] },
    noteKo: { type: String, default: "" },
    noteUz: { type: String, default: "" },
  },
  { _id: false },
);

// "오늘의 퍼즐" — fill-in-the-blank rows. `prompt` holds "___" where the
// learner types; any entry of `answers` is accepted (e.g. don't / do not).
const puzzleRowSchema = new Schema(
  {
    key: { type: String, required: true },
    transform: { type: String, enum: TRANSFORMS, required: true },
    prompt: { type: String, required: true },
    answers: { type: [String], required: true },
    hintKo: { type: String, default: "" },
    hintUz: { type: String, default: "" },
  },
  { _id: false },
);

const puzzleSchema = new Schema(
  {
    verbType: { type: String, enum: VERB_TYPES, required: true },
    baseSentence: { type: String, required: true },
    baseMeaningKo: { type: String, default: "" },
    baseMeaningUz: { type: String, default: "" },
    pronunciationKo: { type: String, default: "" },
    rows: { type: [puzzleRowSchema], default: [] },
  },
  { _id: false },
);

// "Our Story" — open questions answered three times (I / She / He) and
// graded by AI. `examples` holds a model answer per round.
const storyQuestionSchema = new Schema(
  {
    key: { type: String, required: true },
    question: { type: String, required: true },
    pronunciationKo: { type: String, default: "" },
    meaningKo: { type: String, required: true },
    meaningUz: { type: String, required: true },
    grammarType: { type: String, enum: GRAMMAR_TYPES, required: true },
    examples: {
      type: new Schema({ 1: String, 2: String, 3: String }, { _id: false }),
      required: true,
    },
  },
  { _id: false },
);

const verbQuizItemSchema = new Schema(
  {
    key: { type: String, required: true },
    word: { type: String, required: true },
    correctType: { type: String, enum: VERB_TYPES, required: true },
    exampleSentence: { type: String, required: true },
  },
  { _id: false },
);

const textbookLessonSchema = new Schema({
  // Book level (Lv.0, Lv.1, ...). Lesson numbers restart in every book, so
  // (level, lessonNumber) is the unique key — see the index below.
  level: { type: Number, required: true, default: 0 },
  lessonNumber: { type: Number, required: true },
  title: { type: String, required: true },
  titleKo: { type: String, default: "" },
  titleUz: { type: String, default: "" },
  partOfSpeechGuide: {
    type: [
      new Schema(
        {
          partOfSpeech: { type: String, enum: KEYWORD_POS, required: true },
          descriptionKo: String,
          descriptionUz: String,
          exampleKo: String,
          exampleUz: String,
        },
        { _id: false },
      ),
    ],
    default: [],
  },
  keywords: { type: [keywordSchema], default: [] },
  verbTypes: { type: [verbTypeSchema], default: [] },
  verbRuleKo: { type: String, default: "" },
  verbRuleUz: { type: String, default: "" },
  shapeTransforms: { type: [transformCardSchema], default: [] },
  subjectTenseTransforms: { type: [transformCardSchema], default: [] },
  imperative: {
    type: new Schema(
      { ruleKo: String, ruleUz: String, examples: [String], dontRuleKo: String, dontRuleUz: String, dontExample: String },
      { _id: false },
    ),
    default: null,
  },
  puzzles: { type: [puzzleSchema], default: [] },
  storyQuestions: { type: [storyQuestionSchema], default: [] },
  verbClassificationQuiz: { type: [verbQuizItemSchema], default: [] },
  updatedAt: { type: Date, default: Date.now },
});

textbookLessonSchema.index({ level: 1, lessonNumber: 1 }, { unique: true });

export type TextbookLessonDoc = InferSchemaType<typeof textbookLessonSchema> & { _id: Types.ObjectId };

export const TextbookLesson = model("TextbookLesson", textbookLessonSchema);
