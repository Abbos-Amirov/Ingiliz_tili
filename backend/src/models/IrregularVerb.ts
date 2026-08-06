import { Schema, model, InferSchemaType, Types } from "mongoose";
import { IRREGULAR_VERB_CATEGORIES } from "../config/irregularVerbs";

// Irregular verbs are a standalone reference module, deliberately independent
// of the lesson system — this collection has no lessonNumber field.
const irregularVerbSchema = new Schema({
  base: { type: String, required: true, trim: true, lowercase: true },
  past: { type: String, required: true, trim: true, lowercase: true },
  participle: { type: String, required: true, trim: true, lowercase: true },
  korean: { type: String, required: true, trim: true },
  category: { type: String, enum: IRREGULAR_VERB_CATEGORIES, default: "other" },
  frequency: { type: Number, default: null },
  createdAt: { type: Date, default: Date.now },
});

irregularVerbSchema.index({ base: 1 }, { unique: true });

export type IrregularVerbDoc = InferSchemaType<typeof irregularVerbSchema> & { _id: Types.ObjectId };

export const IrregularVerb = model("IrregularVerb", irregularVerbSchema);
