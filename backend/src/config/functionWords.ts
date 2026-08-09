export const FUNCTION_WORD_CATEGORIES = [
  "preposition",
  "article",
  "question_word",
  "infinitive_marker",
  // Auxiliaries that only exist to form a question (do/does/did/is/are/can),
  // as opposed to a Wh- question_word — see FEATURE 3, Savol-Javob glossary.
  "question_auxiliary",
] as const;
export type FunctionWordCategory = (typeof FUNCTION_WORD_CATEGORIES)[number];
