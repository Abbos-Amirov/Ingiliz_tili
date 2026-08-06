import { Schema, model, InferSchemaType, Types } from "mongoose";

const userWordProgressSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  wordId: { type: Schema.Types.ObjectId, ref: "Word", required: true },
  easeFactor: { type: Number, default: 2.5 },
  interval: { type: Number, default: 0 },
  repetitions: { type: Number, default: 0 },
  lapses: { type: Number, default: 0 },
  dueDate: { type: Date, default: Date.now },
  lastReviewedAt: { type: Date, default: null },
  lastResult: { type: String, enum: ["correct", "wrong", "helped", null], default: null },
  // Number of times this word was only recalled with the "Yordam" hint flow,
  // rather than typed independently. Useful for progress stats.
  helpedCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

userWordProgressSchema.index({ userId: 1, wordId: 1 }, { unique: true });
userWordProgressSchema.index({ userId: 1, dueDate: 1 });

export type UserWordProgressDoc = InferSchemaType<typeof userWordProgressSchema> & {
  _id: Types.ObjectId;
};

export const UserWordProgress = model("UserWordProgress", userWordProgressSchema);
