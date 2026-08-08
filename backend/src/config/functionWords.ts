export const FUNCTION_WORD_CATEGORIES = [
  "preposition",
  "article",
  "question_word",
  "infinitive_marker",
] as const;
export type FunctionWordCategory = (typeof FUNCTION_WORD_CATEGORIES)[number];
