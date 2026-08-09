import type { GrammarRole } from "./types";

export const GRAMMAR_ROLES: GrammarRole[] = [
  "subject",
  "verb",
  "auxiliary",
  "object",
  "adjective",
  "adverb",
  "preposition",
  "conjunction",
  "article",
  "pronoun",
  "interjection",
  "question_word",
];

// Labels are in Korean (not English) — this app teaches English to Korean
// speakers, so the grammar-role terminology shown to learners is the Korean
// term they already know (주어, 동사, ...), everywhere a role is labeled:
// the formula bar, word chips, and the sentence-completion summary.
export const ROLE_COLORS: Record<GrammarRole, { bg: string; text: string; label: string }> = {
  subject: { bg: "#DBEAFE", text: "#1E40AF", label: "주어" },
  verb: { bg: "#D1FAE5", text: "#065F46", label: "동사" },
  auxiliary: { bg: "#E5E7EB", text: "#374151", label: "조동사" },
  object: { bg: "#FEF3C7", text: "#92400E", label: "목적어" },
  adjective: { bg: "#EDE9FE", text: "#5B21B6", label: "형용사" },
  adverb: { bg: "#FCE7F3", text: "#9D174D", label: "부사" },
  preposition: { bg: "#E0F2FE", text: "#075985", label: "전치사" },
  conjunction: { bg: "#FEE2E2", text: "#991B1B", label: "접속사" },
  article: { bg: "#F3F4F6", text: "#4B5563", label: "관사" },
  pronoun: { bg: "#CFFAFE", text: "#155E75", label: "대명사" },
  interjection: { bg: "#FFEDD5", text: "#9A3412", label: "감탄사" },
  question_word: { bg: "#FAE8FF", text: "#86198F", label: "의문사" },
};

/** Short abbreviation used inside formula strings, e.g. "S", "V", "O", "Adj". */
export const ROLE_ABBREVIATIONS: Record<GrammarRole, string> = {
  subject: "S",
  verb: "V",
  auxiliary: "be",
  object: "O",
  adjective: "Adj",
  adverb: "Adv",
  preposition: "Prep",
  conjunction: "Conj",
  article: "Art",
  pronoun: "Pron",
  interjection: "Interj",
  question_word: "Wh-",
};
