import { Schema, model, InferSchemaType, Types } from "mongoose";
import { FUNCTION_WORD_CATEGORIES } from "../config/functionWords";

const usageTypeSchema = new Schema(
  {
    meaning: { type: String, required: true, trim: true },
    example: { type: String, required: true, trim: true },
    note: { type: String, default: "" },
  },
  { _id: false },
);

const mistakeSchema = new Schema(
  {
    wrong: { type: String, required: true, trim: true },
    correct: { type: String, required: true, trim: true },
    explanation: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const functionWordSchema = new Schema({
  // Predloglar, artikllar, so'roq so'zlari — repeat in nearly every sentence,
  // so they get one reusable, deep explanation instead of being re-explained
  // inline every time (see Sentence.deepExplanation.wordBreakdown.functionWordRef).
  word: { type: String, required: true, trim: true, lowercase: true },
  category: { type: String, enum: FUNCTION_WORD_CATEGORIES, required: true },
  korean: { type: String, default: "" },
  simpleExplanation: { type: String, default: "" },
  usageTypes: { type: [usageTypeSchema], default: [] },
  commonMistakes: { type: [mistakeSchema], default: [] },
  // Pre-generated pronunciation clip (see Word.audioUrl for why).
  audioUrl: { type: String, default: null },
  order: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

functionWordSchema.index({ word: 1 }, { unique: true });
functionWordSchema.index({ category: 1, order: 1 });

export type FunctionWordDoc = InferSchemaType<typeof functionWordSchema> & { _id: Types.ObjectId };

export const FunctionWord = model("FunctionWord", functionWordSchema);
