import type { IrregularVerbCategory } from "./types";

// Admin panel is Uzbek-only (no locale switching there), so these labels are
// plain text — the user-facing page uses translated labels from useT("irregularVerbs").categories instead.
export const IRREGULAR_VERB_CATEGORY_LABELS: Record<IrregularVerbCategory, string> = {
  movement: "Harakat",
  thinking: "Fikrlash",
  feeling: "His-tuyg'u",
  communication: "Muloqot",
  possession: "Egalik",
  other: "Boshqa",
};

export const IRREGULAR_VERB_CATEGORIES: IrregularVerbCategory[] = [
  "movement",
  "thinking",
  "feeling",
  "communication",
  "possession",
  "other",
];
