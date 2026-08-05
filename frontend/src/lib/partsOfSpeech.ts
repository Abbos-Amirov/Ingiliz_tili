import type { PartOfSpeech } from "./types";

export const PARTS_OF_SPEECH_LABELS: Record<PartOfSpeech, string> = {
  noun: "Ot",
  pronoun: "Olmosh",
  verb: "Fe'l",
  adjective: "Sifat",
  adverb: "Ravish",
  preposition: "Predlog",
  conjunction: "Bog'lovchi",
  article: "Artikl",
  interjection: "Undov",
};

export const PARTS_OF_SPEECH: PartOfSpeech[] = [
  "noun",
  "pronoun",
  "verb",
  "adjective",
  "adverb",
  "preposition",
  "conjunction",
  "article",
  "interjection",
];
