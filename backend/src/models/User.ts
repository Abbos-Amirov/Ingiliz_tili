import { Schema, model, InferSchemaType, Types } from "mongoose";

const userSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  // Optional because Google-signed-up accounts have no password at all —
  // login() and adminLogin() must guard against a null passwordHash rather
  // than calling comparePassword() on it (see auth.controller.ts).
  passwordHash: { type: String, required: false, default: null },
  // Google's stable per-account subject id ("sub" claim). Sparse+unique so
  // multiple password-only accounts collide. No `default` — a sparse index
  // only skips documents where the field is entirely ABSENT, not ones
  // explicitly set to null, so a `default: null` would defeat the sparse
  // index and every second password-only signup would collide on it.
  googleId: { type: String, unique: true, sparse: true },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  displayName: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

export type UserDoc = InferSchemaType<typeof userSchema> & { _id: Types.ObjectId };

export const User = model("User", userSchema);
