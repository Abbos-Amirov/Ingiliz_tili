import { Schema, model, InferSchemaType, Types } from "mongoose";
import { GRAMMAR_ROLES } from "../config/grammar";

const roleWordSchema = new Schema(
  {
    text: { type: String, required: true },
    role: { type: String, enum: GRAMMAR_ROLES, required: true },
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
