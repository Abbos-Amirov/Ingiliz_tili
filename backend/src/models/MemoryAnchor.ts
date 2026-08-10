import { Schema, model, InferSchemaType, Types } from "mongoose";

// A user's personal "Method of Loci" link between a word and a real place/
// object in their life — a photo (or written description) they associate the
// word with. Strictly private: every query in memoryAnchors.controller.ts
// scopes by req.user.id, and there is no route that returns another user's
// anchors. Reuses the same SM-2-lite fields as UserWordProgress (see
// srs.service.ts) so recall scheduling shares one proven implementation.
const memoryAnchorSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  wordId: { type: Schema.Types.ObjectId, ref: "Word", required: true },
  // Base64 data URI of a compressed (~500KB or under) user photo. No external
  // file storage is configured in this project, so small images are stored
  // inline rather than adding a new infrastructure dependency.
  imageUrl: { type: String, default: null },
  textDescription: { type: String, default: null },
  journeyId: { type: Schema.Types.ObjectId, ref: "MemoryJourney", default: null },
  journeyOrder: { type: Number, default: null },
  createdAt: { type: Date, default: Date.now },
  lastRecalledAt: { type: Date, default: null },
  easeFactor: { type: Number, default: 2.5 },
  recallSrsInterval: { type: Number, default: 0 },
  repetitions: { type: Number, default: 0 },
  lapses: { type: Number, default: 0 },
  dueDate: { type: Date, default: Date.now },
  recallCorrectCount: { type: Number, default: 0 },
  recallIncorrectCount: { type: Number, default: 0 },
});

memoryAnchorSchema.index({ userId: 1, wordId: 1 }, { unique: true });
memoryAnchorSchema.index({ userId: 1, dueDate: 1 });
memoryAnchorSchema.index({ userId: 1, journeyId: 1, journeyOrder: 1 });

export type MemoryAnchorDoc = InferSchemaType<typeof memoryAnchorSchema> & {
  _id: Types.ObjectId;
};

export const MemoryAnchor = model("MemoryAnchor", memoryAnchorSchema);
