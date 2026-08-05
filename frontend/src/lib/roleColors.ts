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
];

export const ROLE_COLORS: Record<GrammarRole, { bg: string; text: string; label: string }> = {
  subject: { bg: "#DBEAFE", text: "#1E40AF", label: "Subject" },
  verb: { bg: "#D1FAE5", text: "#065F46", label: "Verb" },
  auxiliary: { bg: "#E5E7EB", text: "#374151", label: "Auxiliary" },
  object: { bg: "#FEF3C7", text: "#92400E", label: "Object" },
  adjective: { bg: "#EDE9FE", text: "#5B21B6", label: "Adjective" },
  adverb: { bg: "#FCE7F3", text: "#9D174D", label: "Adverb" },
  preposition: { bg: "#E0F2FE", text: "#075985", label: "Preposition" },
  conjunction: { bg: "#FEE2E2", text: "#991B1B", label: "Conjunction" },
  article: { bg: "#F3F4F6", text: "#4B5563", label: "Article" },
  pronoun: { bg: "#CFFAFE", text: "#155E75", label: "Pronoun" },
  interjection: { bg: "#FFEDD5", text: "#9A3412", label: "Interjection" },
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
};
