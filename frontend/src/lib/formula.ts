import type { GrammarRole } from "./types";

export interface FormulaToken {
  text: string;
  role: GrammarRole | null;
}

/** Best-effort mapping from a formula token (e.g. "S", "V-ing", "but") to a grammatical role, for coloring. */
function resolveTokenRole(token: string): GrammarRole | null {
  const clean = token.replace(/,$/, "").trim();
  if (/^S$/i.test(clean)) return "subject";
  if (/^O$/i.test(clean)) return "object";
  if (/^Adj$/i.test(clean)) return "adjective";
  if (/^Adv$/i.test(clean)) return "adverb";
  if (/^V(-ing|3)?$/i.test(clean)) return "verb";
  if (/^(be|is|am|are|was|were|will|modal|didn't|don't|doesn't|do|does|have|has)$/i.test(clean)) return "auxiliary";
  if (/^Prep$/i.test(clean)) return "preposition";
  if (/^Art$/i.test(clean)) return "article";
  if (/^Pron$/i.test(clean)) return "pronoun";
  if (/^(and|but|because|if|conj)$/i.test(clean)) return "conjunction";
  if (/^Wh-?$/i.test(clean)) return "question_word";
  return null;
}

/** Splits a formula string like "S+be+V-ing+O" into colorable tokens. */
export function parseFormula(formula: string): FormulaToken[] {
  return formula
    .split("+")
    .map((t) => t.trim())
    .filter(Boolean)
    .map((text) => ({ text, role: resolveTokenRole(text) }));
}
