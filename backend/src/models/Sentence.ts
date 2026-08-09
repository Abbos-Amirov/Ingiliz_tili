import { Schema, model, InferSchemaType, Types } from "mongoose";
import { GRAMMAR_ROLES } from "../config/grammar";
import { trilingualSchema } from "./schemas/trilingual";

const roleWordSchema = new Schema(
  {
    text: { type: String, required: true },
    role: { type: String, enum: GRAMMAR_ROLES, required: true },
    // Pre-generated pronunciation clip for this individual word — played
    // when the learner taps it while building the sentence (see
    // Word.audioUrl / Sentence.audioUrl for why real clips, not
    // speechSynthesis, are used).
    audioUrl: { type: String, default: null },
  },
  { _id: false },
);

// Per-word breakdown shown in the opt-in "Chuqur tushuntirish" (deep
// explanation) popup after a sentence is completed correctly. text/role are
// filled in from the sentence's own `words` at generation time (not trusted
// from the AI response), so they always stay in sync.
const wordExplanationSchema = new Schema(
  {
    text: { type: String, required: true },
    role: { type: String, enum: GRAMMAR_ROLES, required: true },
    // Trilingual — follows the app's language switcher (see translations.ts).
    simpleExplanation: { type: trilingualSchema, default: () => ({}) },
    moreExamples: { type: [String], default: [] },
    // Matches a FunctionWord.word (e.g. "to", "the") when this token is a
    // predloglar/artikl/so'roq so'zi worth a deeper, reusable explanation —
    // the popup links out to the Function Words glossary instead of
    // repeating that explanation on every sentence.
    functionWordRef: { type: String, default: null },
    // Optional extra callout for question-specific quirks — e.g. "the
    // auxiliary comes BEFORE the subject in a question" (see FEATURE 2,
    // Savol-Javob deep-explanation extension). Null when not applicable.
    specialNote: { type: trilingualSchema, default: null },
  },
  { _id: false },
);

const deepExplanationSchema = new Schema(
  {
    wordBreakdown: { type: [wordExplanationSchema], default: [] },
    generalRule: { type: trilingualSchema, default: () => ({}) },
    practiceExamples: { type: [String], default: [] },
  },
  { _id: false },
);

const sentenceSchema = new Schema({
  korean: { type: String, required: true, trim: true },
  // The correct, ordered sentence — each word tagged with its grammatical role.
  words: { type: [roleWordSchema], required: true },
  // Extra wrong-choice words mixed into the pool, also role-tagged (e.g. "goes"
  // as a distractor for "going", tagged role: "verb").
  distractorWords: { type: [roleWordSchema], default: [] },
  // The grammar pattern this sentence teaches, e.g. "S+be+V-ing+O".
  formula: { type: String, default: "" },
  // Optional, admin-curated (usually AI-drafted) child-friendly breakdown of
  // how this sentence is built — see FEATURE 1 "Gap tahlili". Null until
  // generated/saved for a given sentence.
  deepExplanation: { type: deepExplanationSchema, default: null },
  // Pre-generated pronunciation clip of the full English sentence (see
  // Word.audioUrl for why — the browser speechSynthesis API isn't reliable
  // across in-app browsers like KakaoTalk or Android WebView).
  audioUrl: { type: String, default: null },
  // Auto-generated practice material for the Grammar Hub module (see
  // GrammarTopic). Kept out of the regular lesson curriculum — excluded from
  // /sentences unless queried by `formula`, and from the lessons listing —
  // so it never mixes into /learn/sentence or the Darslar lesson cards.
  isGrammarPractice: { type: Boolean, default: false },
  level: {
    type: String,
    enum: ["beginner", "intermediate", "advanced"],
    default: "beginner",
  },
  // See Word.lessonNumber/lessonNumberEnd — same inclusive-range convention.
  // Not meaningful for question/answer sentences (see sentenceType below) —
  // those are an independent module, like Irregular Verbs, not tied to the
  // Darslar/lesson curriculum.
  lessonNumber: { type: Number, required: true, default: 1 },
  lessonNumberEnd: { type: Number, required: true, default: 1 },
  // "statement" is the regular Sentence Building curriculum (default, and
  // the only kind that had ever existed before this field). "question" and
  // "answer" sentences belong to the Savol-Javob module — each question
  // links to its answer (and vice versa) via pairId, and both are excluded
  // from the regular curriculum listing (see sentences.controller.ts).
  sentenceType: { type: String, enum: ["statement", "question", "answer"], default: "statement" },
  pairId: { type: Schema.Types.ObjectId, ref: "Sentence", default: null },
  // Only meaningful when sentenceType === "question".
  questionCategory: { type: String, enum: ["yes_no", "wh_question", null], default: null },
  // Progressive sub-stage within a level for the Savol-Javob module: 1 =
  // plain statements, 2 = Yes/No question-answer pairs, 3 = Wh- pairs.
  subLevel: { type: Number, enum: [1, 2, 3], default: 1 },
  createdAt: { type: Date, default: Date.now },
});

sentenceSchema.index({ lessonNumber: 1, lessonNumberEnd: 1 });
sentenceSchema.index({ sentenceType: 1, level: 1, subLevel: 1 });

export type SentenceDoc = InferSchemaType<typeof sentenceSchema> & { _id: Types.ObjectId };

export const Sentence = model("Sentence", sentenceSchema);
