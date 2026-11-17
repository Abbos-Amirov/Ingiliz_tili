import { Schema, model, InferSchemaType, Types } from "mongoose";

// A learner's progress through one TextbookLesson. Everything here is
// written by the server as a side effect of graded work (puzzle checks, AI
// answer checks) — there is no endpoint that lets a learner tick things off
// by hand, so the derived checklist reflects real work only.
const storyAnswerSchema = new Schema(
  {
    questionKey: { type: String, required: true },
    round: { type: Number, enum: [1, 2, 3], required: true },
    koreanDraft: { type: String, default: "" },
    answer: { type: String, required: true },
    isCorrect: { type: Boolean, required: true },
    correctedSentence: { type: String, default: "" },
    errorLocation: { type: String, default: "" },
    explanationKo: { type: String, default: "" },
    explanationUz: { type: String, default: "" },
    // Grammar features the grader found in the sentence (CHECKLIST_COLUMNS
    // minus subject_change) — feeds the 문장 변형 체크 table.
    features: { type: [String], default: [] },
    checkedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const userLessonProgressSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  lessonId: { type: Schema.Types.ObjectId, ref: "TextbookLesson", required: true },
  // Keys of puzzle rows answered correctly at least once.
  completedExercises: { type: [String], default: [] },
  // Latest graded answer per (questionKey, round) — replaced on re-check.
  storyAnswers: { type: [storyAnswerSchema], default: [] },
  updatedAt: { type: Date, default: Date.now },
});

userLessonProgressSchema.index({ userId: 1, lessonId: 1 }, { unique: true });

export type UserLessonProgressDoc = InferSchemaType<typeof userLessonProgressSchema> & { _id: Types.ObjectId };

export const UserLessonProgress = model("UserLessonProgress", userLessonProgressSchema);
