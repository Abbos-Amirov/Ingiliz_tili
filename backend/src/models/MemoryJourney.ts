import { Schema, model, InferSchemaType, Types } from "mongoose";

const memoryJourneySchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

memoryJourneySchema.index({ userId: 1, createdAt: -1 });

export type MemoryJourneyDoc = InferSchemaType<typeof memoryJourneySchema> & {
  _id: Types.ObjectId;
};

export const MemoryJourney = model("MemoryJourney", memoryJourneySchema);
