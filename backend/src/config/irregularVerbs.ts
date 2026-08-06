export const IRREGULAR_VERB_CATEGORIES = [
  "movement",
  "thinking",
  "feeling",
  "communication",
  "possession",
  "other",
] as const;
export type IrregularVerbCategory = (typeof IRREGULAR_VERB_CATEGORIES)[number];
