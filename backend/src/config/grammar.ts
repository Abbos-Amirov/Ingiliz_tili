// Parts of speech: a word's permanent dictionary-level classification.
export const PARTS_OF_SPEECH = [
  "noun",
  "pronoun",
  "verb",
  "adjective",
  "adverb",
  "preposition",
  "conjunction",
  "article",
  "interjection",
] as const;
export type PartOfSpeech = (typeof PARTS_OF_SPEECH)[number];

// Grammatical roles: a word's function within a specific sentence (can differ
// from its part of speech — e.g. a noun can serve as the subject or object).
export const GRAMMAR_ROLES = [
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
] as const;
export type GrammarRole = (typeof GRAMMAR_ROLES)[number];

export type Level = "beginner" | "intermediate" | "advanced";

interface LevelDefinition {
  formulas: string[];
  activeRoles: GrammarRole[];
}

export const LEVEL_CONFIG: Record<Level, LevelDefinition> = {
  beginner: {
    formulas: ["S+V+O", "S+be+V-ing", "S+V+Adj"],
    activeRoles: ["subject", "verb", "object", "adjective"],
  },
  intermediate: {
    formulas: [
      "S+V+O",
      "S+be+V-ing",
      "S+V+Adj",
      "S+V+O,+but+S+V+Adj",
      "S+V+O+because+S+V",
    ],
    activeRoles: ["subject", "verb", "object", "adjective", "pronoun", "article", "conjunction"],
  },
  advanced: {
    formulas: [
      "S+have+V3",
      "S+will+V",
      "S+modal+V",
      "S+V+O+O",
      "Wh-+do/does+S+V",
    ],
    activeRoles: [
      "subject",
      "verb",
      "object",
      "adjective",
      "adverb",
      "preposition",
      "conjunction",
      "article",
      "pronoun",
      "interjection",
    ],
  },
};
