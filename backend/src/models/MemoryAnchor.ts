import { Schema, model, InferSchemaType, Types } from "mongoose";
import { PALACE_ROOM_KEYS, ROOM_ASSIGNED_BY } from "../config/palaceRooms";

// Unsplash's API terms require crediting the photographer + linking back to
// Unsplash wherever a photo is displayed (mirrors Word.ts's identical
// sub-schema) — only set when imageUrl came from suggestedPhotos, not from
// the user's own uploaded photo.
const imageAttributionSchema = new Schema(
  {
    photographerName: { type: String, required: true },
    photographerUrl: { type: String, required: true },
    unsplashUrl: { type: String, required: true },
  },
  { _id: false },
);

// A user's personal "Method of Loci" link between a word and a real place/
// object in their life — a photo (or written description) they associate the
// word with. Strictly private: every query in memoryAnchors.controller.ts
// scopes by req.user.id, and there is no route that returns another user's
// anchors. Reuses the same SM-2-lite fields as UserWordProgress (see
// srs.service.ts) so recall scheduling shares one proven implementation.
const memoryAnchorSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  wordId: { type: Schema.Types.ObjectId, ref: "Word", required: true },
  // Either a base64 data URI of a compressed (~500KB or under) user photo
  // (no external file storage is configured in this project, so small
  // images are stored inline), or an Unsplash `small` URL picked from
  // suggestedPhotos — imageAttribution is only set for the latter.
  imageUrl: { type: String, default: null },
  imageAttribution: { type: imageAttributionSchema, default: null },
  textDescription: { type: String, default: null },
  journeyId: { type: Schema.Types.ObjectId, ref: "MemoryJourney", default: null },
  journeyOrder: { type: Number, default: null },
  // Which "fairy tale room" this word lives in — optional, a word can be
  // saved without one (see PALACE_ROOM_KEYS). roomAssignedBy records whether
  // the AI suggestion was accepted as-is or the user picked a different room,
  // purely informational (not used in any query).
  roomKey: { type: String, enum: PALACE_ROOM_KEYS, default: null },
  roomAssignedBy: { type: String, enum: ROOM_ASSIGNED_BY, default: null },
  createdAt: { type: Date, default: Date.now },
  lastRecalledAt: { type: Date, default: null },
  easeFactor: { type: Number, default: 2.5 },
  recallSrsInterval: { type: Number, default: 0 },
  repetitions: { type: Number, default: 0 },
  lapses: { type: Number, default: 0 },
  dueDate: { type: Date, default: Date.now },
  recallCorrectCount: { type: Number, default: 0 },
  recallIncorrectCount: { type: Number, default: 0 },
  // Set when the learner explicitly marks this word "known" from the Recall
  // card — pulls it out of the main /next-for-recall pool (see
  // memoryAnchors.controller.ts) without touching its SRS fields, so
  // un-marking it later resumes scheduling from wherever it left off.
  knownAt: { type: Date, default: null },
});

memoryAnchorSchema.index({ userId: 1, wordId: 1 }, { unique: true });
memoryAnchorSchema.index({ userId: 1, dueDate: 1 });
memoryAnchorSchema.index({ userId: 1, journeyId: 1, journeyOrder: 1 });
memoryAnchorSchema.index({ userId: 1, roomKey: 1 });
memoryAnchorSchema.index({ userId: 1, knownAt: 1 });

export type MemoryAnchorDoc = InferSchemaType<typeof memoryAnchorSchema> & {
  _id: Types.ObjectId;
};

export const MemoryAnchor = model("MemoryAnchor", memoryAnchorSchema);
