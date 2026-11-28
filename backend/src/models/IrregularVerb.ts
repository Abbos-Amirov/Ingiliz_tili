import { Schema, model, InferSchemaType, Types } from "mongoose";
import { IRREGULAR_VERB_CATEGORIES } from "../config/irregularVerbs";

// Irregular verbs are a standalone reference module, deliberately independent
// of the lesson system — this collection has no lessonNumber field.
const irregularVerbSchema = new Schema({
  base: { type: String, required: true, trim: true, lowercase: true },
  past: { type: String, required: true, trim: true, lowercase: true },
  participle: { type: String, required: true, trim: true, lowercase: true },
  // -ing form (from the textbook's verb tables); "" when not filled in.
  ing: { type: String, default: "", trim: true, lowercase: true },
  // Regular (-ed) verbs from the textbook's ① table share this page with the
  // irregular ones; the page groups them by this flag and by form pattern.
  regular: { type: Boolean, default: false },
  korean: { type: String, required: true, trim: true },
  uzbek: { type: String, default: "" },
  category: { type: String, enum: IRREGULAR_VERB_CATEGORIES, default: "other" },
  frequency: { type: Number, default: null },
  createdAt: { type: Date, default: Date.now },
});

irregularVerbSchema.index({ base: 1 }, { unique: true });

export type IrregularVerbDoc = InferSchemaType<typeof irregularVerbSchema> & { _id: Types.ObjectId };

export const IrregularVerb = model("IrregularVerb", irregularVerbSchema);
