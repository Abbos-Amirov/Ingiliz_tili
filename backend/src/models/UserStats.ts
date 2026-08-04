import { Schema, model, InferSchemaType, Types } from "mongoose";

const userStatsSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  lastActiveDate: { type: String, default: null },
  wordsLearnedToday: { type: Number, default: 0 },
  dailyGoal: { type: Number, default: 10 },
  totalWordsLearned: { type: Number, default: 0 },
});

export type UserStatsDoc = InferSchemaType<typeof userStatsSchema> & { _id: Types.ObjectId };

export const UserStats = model("UserStats", userStatsSchema);
