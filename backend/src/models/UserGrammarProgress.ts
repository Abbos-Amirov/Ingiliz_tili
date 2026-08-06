import { Schema, model, InferSchemaType, Types } from "mongoose";

// Mastery is derived (questionsCorrect / questionsTotal) rather than stored,
// so it never drifts out of sync with the raw counts.
const userGrammarProgressSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  topicId: { type: Schema.Types.ObjectId, ref: "GrammarTopic", required: true },
  questionsCorrect: { type: Number, default: 0 },
  questionsTotal: { type: Number, default: 0 },
  lastPracticedAt: { type: Date, default: null },
});

userGrammarProgressSchema.index({ userId: 1, topicId: 1 }, { unique: true });

export type UserGrammarProgressDoc = InferSchemaType<typeof userGrammarProgressSchema> & {
  _id: Types.ObjectId;
};

export const UserGrammarProgress = model("UserGrammarProgress", userGrammarProgressSchema);
