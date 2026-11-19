import { Schema, model, InferSchemaType, Types } from "mongoose";

// One book of the Pallo! series (Lv.0, Lv.1, ...). Seeded from
// src/data/textbook/books.ts on first start, then managed in the admin
// (title, subtitle, cover). An uploaded cover is stored in the document and
// served by GET /api/textbook/books/:level/cover (no file storage is set up
// for images in this project); `coverUrl` is the bundled fallback.
const textbookBookSchema = new Schema({
  level: { type: Number, required: true, unique: true },
  title: { type: String, required: true },
  subtitle: { type: String, default: "" },
  coverUrl: { type: String, default: null },
  coverImage: {
    type: new Schema({ data: { type: Buffer, required: true }, contentType: { type: String, required: true } }, { _id: false }),
    default: null,
  },
  updatedAt: { type: Date, default: Date.now },
});

export type TextbookBookDoc = InferSchemaType<typeof textbookBookSchema> & { _id: Types.ObjectId };

export const TextbookBook = model("TextbookBook", textbookBookSchema);
