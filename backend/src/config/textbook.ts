// Shared enums for the Pallo! textbook ("darslik") feature — see
// models/TextbookLesson.ts for how a lesson is structured.

// The three verb families the textbook teaches (동사 한눈에 보기).
export const VERB_TYPES = ["be_verb", "general_verb", "modal_verb"] as const;
export type VerbType = (typeof VERB_TYPES)[number];

// Every sentence transformation the textbook drills (변형 한눈에 보기 /
// 오늘의 퍼즐). "base" is the starting sentence itself.
export const TRANSFORMS = [
  "base",
  "negative",
  "question",
  "wh_question",
  "subject",
  "past",
  "future",
  "continuous",
  "imperative",
] as const;
export type Transform = (typeof TRANSFORMS)[number];

// The grammar focus of an Our Story question (the orange tag in the book:
// 기본 문장·be동사, 부정, 과거, ...). Also used as UserMistake.grammarType.
export const GRAMMAR_TYPES = [
  "be_verb",
  "general_verb",
  "modal",
  "negative",
  "question",
  "wh_question",
  "subject",
  "past",
  "future",
  "continuous",
  "imperative",
] as const;
export type GrammarType = (typeof GRAMMAR_TYPES)[number];

// Columns of the book's "문장 변형 체크" table, in the book's order. The
// table is filled automatically from graded Our Story answers (see
// textbook.service.ts computeChecklist) — learners can't tick it by hand.
export const CHECKLIST_COLUMNS = [
  "be_verb",
  "general_verb",
  "modal_verb",
  "negative",
  "question",
  "wh_question",
  "past",
  "future",
  "continuous",
  "subject_change",
  "imperative",
] as const;
export type ChecklistColumn = (typeof CHECKLIST_COLUMNS)[number];

// Grammar features the AI grader may detect in a learner's sentence — every
// checklist column except subject_change, which is derived from the round.
export const DETECTABLE_FEATURES = CHECKLIST_COLUMNS.filter((c) => c !== "subject_change");

// Our Story is written three times: round 1 with "I", 2 with "She", 3 with "He".
export const ROUND_SUBJECTS: Record<1 | 2 | 3, "I" | "She" | "He"> = { 1: "I", 2: "She", 3: "He" };

export const KEYWORD_POS = ["noun", "verb", "adjective"] as const;
export type KeywordPos = (typeof KEYWORD_POS)[number];
