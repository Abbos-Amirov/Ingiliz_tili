import { Schema, model, InferSchemaType, Types } from "mongoose";
import { GRAMMAR_ROLES } from "../config/grammar";

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
    simpleExplanation: { type: String, default: "" },
    moreExamples: { type: [String], default: [] },
    // Matches a FunctionWord.word (e.g. "to", "the") when this token is a
    // predloglar/artikl/so'roq so'zi worth a deeper, reusable explanation —
    // the popup links out to the Function Words glossary instead of
    // repeating that explanation on every sentence.
    functionWordRef: { type: String, default: null },
  },
  { _id: false },
);

const deepExplanationSchema = new Schema(
  {
    wordBreakdown: { type: [wordExplanationSchema], default: [] },
    generalRule: { type: String, default: "" },
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
  lessonNumber: { type: Number, required: true, default: 1 },
  lessonNumberEnd: { type: Number, required: true, default: 1 },
  createdAt: { type: Date, default: Date.now },
});

sentenceSchema.index({ lessonNumber: 1, lessonNumberEnd: 1 });

export type SentenceDoc = InferSchemaType<typeof sentenceSchema> & { _id: Types.ObjectId };

export const Sentence = model("Sentence", sentenceSchema);
