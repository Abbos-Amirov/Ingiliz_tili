import { Schema, model, InferSchemaType, Types } from "mongoose";

const usageCaseSchema = new Schema(
  {
    uz: { type: String, required: true, trim: true },
    example: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const relatedFormulaSchema = new Schema(
  {
    relatedTopicId: { type: Schema.Types.ObjectId, ref: "GrammarTopic", required: true },
    title: { type: String, required: true, trim: true },
    difference: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const commonMistakeSchema = new Schema(
  {
    wrong: { type: String, required: true, trim: true },
    correct: { type: String, required: true, trim: true },
    explanation: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const grammarExampleSchema = new Schema(
  {
    english: { type: String, required: true, trim: true },
    korean: { type: String, required: true, trim: true },
    uzbek: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const grammarTopicSchema = new Schema({
  // Trilingual so the topic name follows the app's language switcher, same
  // as ruleExplanation below.
  title: {
    uz: { type: String, required: true, trim: true },
    en: { type: String, required: true, trim: true },
    ko: { type: String, required: true, trim: true },
  },
  // Rendered with the same role-based coloring as Sentence.formula.
  formula: { type: String, required: true, trim: true },
  level: { type: String, enum: ["beginner", "intermediate", "advanced"], required: true },
  // Display order within its level.
  order: { type: Number, default: 0 },

  ruleExplanation: {
    uz: { type: String, default: "" },
    en: { type: String, default: "" },
    ko: { type: String, default: "" },
  },

  usageCases: { type: [usageCaseSchema], default: [] },
  relatedFormulas: { type: [relatedFormulaSchema], default: [] },
  commonMistakes: { type: [commonMistakeSchema], default: [] },
  examples: { type: [grammarExampleSchema], default: [] },

  createdAt: { type: Date, default: Date.now },
});

grammarTopicSchema.index({ level: 1, order: 1 });
grammarTopicSchema.index({ "title.uz": 1 }, { unique: true });

export type GrammarTopicDoc = InferSchemaType<typeof grammarTopicSchema> & { _id: Types.ObjectId };

export const GrammarTopic = model("GrammarTopic", grammarTopicSchema);
