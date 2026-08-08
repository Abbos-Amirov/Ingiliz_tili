import { Schema } from "mongoose";

// Shared shape for any UI-facing prose that must follow the app's language
// switcher (uz/en/ko) — see translations.ts's Locale type. Example
// sentences stay plain English strings elsewhere (they're content, not UI
// chrome, so they don't change with the switcher).
export const trilingualSchema = new Schema(
  {
    uz: { type: String, default: "" },
    en: { type: String, default: "" },
    ko: { type: String, default: "" },
  },
  { _id: false },
);
