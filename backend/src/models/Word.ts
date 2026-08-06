import { Schema, model, InferSchemaType, Types } from "mongoose";
import { PARTS_OF_SPEECH } from "../config/grammar";

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
  // The word's permanent dictionary-level part of speech (noun, verb, ...).
  // Distinct from a Sentence word's grammatical role, which is contextual.
  partOfSpeech: { type: String, enum: [...PARTS_OF_SPEECH, null], default: null },
  // Pre-generated pronunciation clips (served as static files) — used
  // instead of the browser's speechSynthesis API, which many in-app
  // browsers (KakaoTalk, Instagram, ...) and Android WebView don't support.
  audioUrl: { type: String, default: null },
  koreanAudioUrl: { type: String, default: null },
  imageUrl: { type: String, default: null },
  // A word belongs to a lesson range [lessonNumber, lessonNumberEnd] (inclusive).
  // A single lesson is stored as lessonNumber === lessonNumberEnd; combined
  // teaching days (e.g. lessons 34-37 covered together) set a wider range.
  lessonNumber: { type: Number, required: true, default: 1 },
  lessonNumberEnd: { type: Number, required: true, default: 1 },
  createdAt: { type: Date, default: Date.now },
});

wordSchema.index({ english: 1, korean: 1 }, { unique: true });
wordSchema.index({ lessonNumber: 1, lessonNumberEnd: 1 });

export type WordDoc = InferSchemaType<typeof wordSchema> & { _id: Types.ObjectId };

export const Word = model("Word", wordSchema);
