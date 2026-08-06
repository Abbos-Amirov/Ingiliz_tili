import { Schema, model, InferSchemaType, Types } from "mongoose";

const formStatus = ["correct", "wrong", "helped", "not_started"] as const;

// Past and participle are tracked as two fully independent SRS tracks —
// a learner can know "went" cold while still fumbling "gone", so each form
// gets its own SM-2 state (eased separately, due on its own schedule).
const userIrregularVerbProgressSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  irregularVerbId: { type: Schema.Types.ObjectId, ref: "IrregularVerb", required: true },

  pastStatus: { type: String, enum: formStatus, default: "not_started" },
  pastEaseFactor: { type: Number, default: 2.5 },
  pastInterval: { type: Number, default: 0 },
  pastRepetitions: { type: Number, default: 0 },
  pastLapses: { type: Number, default: 0 },
  pastDueDate: { type: Date, default: Date.now },
  pastHelpedCount: { type: Number, default: 0 },

  participleStatus: { type: String, enum: formStatus, default: "not_started" },
  participleEaseFactor: { type: Number, default: 2.5 },
  participleInterval: { type: Number, default: 0 },
  participleRepetitions: { type: Number, default: 0 },
  participleLapses: { type: Number, default: 0 },
  participleDueDate: { type: Date, default: Date.now },
  participleHelpedCount: { type: Number, default: 0 },

  createdAt: { type: Date, default: Date.now },
});

userIrregularVerbProgressSchema.index({ userId: 1, irregularVerbId: 1 }, { unique: true });
userIrregularVerbProgressSchema.index({ userId: 1, pastDueDate: 1 });
userIrregularVerbProgressSchema.index({ userId: 1, participleDueDate: 1 });

export type UserIrregularVerbProgressDoc = InferSchemaType<typeof userIrregularVerbProgressSchema> & {
  _id: Types.ObjectId;
};

export const UserIrregularVerbProgress = model("UserIrregularVerbProgress", userIrregularVerbProgressSchema);
