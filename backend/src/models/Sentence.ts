import { Schema, model, InferSchemaType, Types } from "mongoose";

const sentenceSchema = new Schema({
  korean: { type: String, required: true, trim: true },
  englishWords: { type: [String], required: true },
  distractorWords: { type: [String], default: [] },
  level: {
    type: String,
    enum: ["beginner", "intermediate", "advanced"],
    default: "beginner",
  },
  lessonNumber: { type: Number, required: true, default: 1 },
  createdAt: { type: Date, default: Date.now },
});

sentenceSchema.index({ lessonNumber: 1 });

export type SentenceDoc = InferSchemaType<typeof sentenceSchema> & { _id: Types.ObjectId };

export const Sentence = model("Sentence", sentenceSchema);
