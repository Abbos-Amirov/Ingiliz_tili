import { Schema, model, InferSchemaType, Types } from "mongoose";
import { GRAMMAR_TYPES } from "../config/textbook";

// One wrong answer in the textbook feature (AI-graded Our Story answer,
// puzzle blank, or verb-classification pick), tagged with the grammar point
// it tested. Aggregated by GET /api/user/mistake-stats into the "you most
// often get X wrong" insight. Append-only: nothing edits or deletes these.
const userMistakeSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  lessonId: { type: Schema.Types.ObjectId, ref: "TextbookLesson", required: true },
  // Stable exercise key (TextbookLesson puzzle row / story question / quiz
  // item key) rather than an ObjectId — see TextbookLesson.ts.
  exerciseId: { type: String, required: true },
  source: { type: String, enum: ["story", "puzzle", "verb_quiz"], required: true },
  grammarType: { type: String, enum: GRAMMAR_TYPES, required: true },
  answer: { type: String, default: "" },
  errorLocation: { type: String, default: "" },
  errorExplanation: { type: String, default: "" },
  errorExplanationUz: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

userMistakeSchema.index({ userId: 1, grammarType: 1 });

export type UserMistakeDoc = InferSchemaType<typeof userMistakeSchema> & { _id: Types.ObjectId };

export const UserMistake = model("UserMistake", userMistakeSchema);
