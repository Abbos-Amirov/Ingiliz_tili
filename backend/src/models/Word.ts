import { Schema, model, InferSchemaType, Types } from "mongoose";

const wordSchema = new Schema({
  english: { type: String, required: true, trim: true },
  korean: { type: String, required: true, trim: true },
  exampleSentenceEn: { type: String, default: "" },
  exampleSentenceKo: { type: String, default: "" },
  category: { type: String, default: "general", index: true },
  difficulty: {
    type: String,
    enum: ["beginner", "intermediate", "advanced"],
    default: "beginner",
  },
  audioUrl: { type: String, default: null },
  imageUrl: { type: String, default: null },
  lessonNumber: { type: Number, required: true, default: 1 },
  createdAt: { type: Date, default: Date.now },
});

wordSchema.index({ english: 1, korean: 1 }, { unique: true });
wordSchema.index({ lessonNumber: 1 });

export type WordDoc = InferSchemaType<typeof wordSchema> & { _id: Types.ObjectId };

export const Word = model("Word", wordSchema);
