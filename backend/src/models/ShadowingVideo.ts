import { Schema, model, InferSchemaType, Types } from "mongoose";

const transcriptWordSchema = new Schema(
  {
    word: { type: String, required: true },
    startTime: { type: Number, required: true },
    endTime: { type: Number, required: true },
    // Word-by-word gloss (see ai.service.ts's translateWordsBatch) —
    // optional because it's filled in once by the same "AI bilan tarjima
    // qilish" action that computes `sentences[]` below, not at transcribe
    // time. null until then.
    translationUz: { type: String, default: null },
    translationKo: { type: String, default: null },
  },
  { _id: false },
);

const sentenceTranslationSchema = new Schema(
  {
    uz: { type: String, required: true },
    ko: { type: String, required: true },
  },
  { _id: false },
);

// Sentence-level grouping of the word-level transcript above, with a
// pre-computed translation (see ai.service.ts's translateShadowingSentence)
// — kept separate from `transcript` rather than derived on the fly on every
// page load, since segmentation + translation only needs to run once per
// video (see shadowing.controller.ts's translateShadowingSentences).
const shadowingSentenceSchema = new Schema(
  {
    text: { type: String, required: true },
    startTime: { type: Number, required: true },
    endTime: { type: Number, required: true },
    translation: { type: sentenceTranslationSchema, required: true },
  },
  { _id: false },
);

const shadowingVideoSchema = new Schema({
  title: { type: String, required: true, trim: true },
  videoUrl: { type: String, required: true },
  level: {
    type: String,
    enum: ["beginner", "intermediate", "advanced"],
    default: "beginner",
  },
  duration: { type: Number, default: 0 },
  transcript: { type: [transcriptWordSchema], default: [] },
  sentences: { type: [shadowingSentenceSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
});

export type ShadowingVideoDoc = InferSchemaType<typeof shadowingVideoSchema> & { _id: Types.ObjectId };

export const ShadowingVideo = model("ShadowingVideo", shadowingVideoSchema);
