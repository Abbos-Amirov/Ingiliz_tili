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

const sentenceSchema = new Schema({
  korean: { type: String, required: true, trim: true },
  // The correct, ordered sentence — each word tagged with its grammatical role.
  words: { type: [roleWordSchema], required: true },
  // Extra wrong-choice words mixed into the pool, also role-tagged (e.g. "goes"
  // as a distractor for "going", tagged role: "verb").
  distractorWords: { type: [roleWordSchema], default: [] },
  // The grammar pattern this sentence teaches, e.g. "S+be+V-ing+O".
  formula: { type: String, default: "" },
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
