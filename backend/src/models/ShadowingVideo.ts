import { Schema, model, InferSchemaType, Types } from "mongoose";

const transcriptWordSchema = new Schema(
  {
    word: { type: String, required: true },
    startTime: { type: Number, required: true },
    endTime: { type: Number, required: true },
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
  createdAt: { type: Date, default: Date.now },
});

export type ShadowingVideoDoc = InferSchemaType<typeof shadowingVideoSchema> & { _id: Types.ObjectId };

export const ShadowingVideo = model("ShadowingVideo", shadowingVideoSchema);
