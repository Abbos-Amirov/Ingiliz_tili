import type { Trilingual } from "./types";

// Short "what this Wh- word is asking about" phrases, shown as a badge next
// to a question in the Savol-Javob module (see FEATURE 1). Keyed by the
// lowercase Wh- word.
export const WH_WORD_MEANING: Record<string, Trilingual> = {
  what: { uz: "narsa haqida so'ralmoqda", en: "asking about a thing", ko: "사물에 대해 묻는 중" },
  who: { uz: "kishi haqida so'ralmoqda", en: "asking about a person", ko: "사람에 대해 묻는 중" },
  where: { uz: "joy haqida so'ralmoqda", en: "asking about a place", ko: "장소에 대해 묻는 중" },
  when: { uz: "vaqt haqida so'ralmoqda", en: "asking about time", ko: "시간에 대해 묻는 중" },
  why: { uz: "sabab haqida so'ralmoqda", en: "asking about a reason", ko: "이유에 대해 묻는 중" },
  how: { uz: "usul/holat haqida so'ralmoqda", en: "asking about how/manner", ko: "방법이나 상태에 대해 묻는 중" },
  which: { uz: "tanlov haqida so'ralmoqda", en: "asking about a choice", ko: "선택에 대해 묻는 중" },
  whose: { uz: "egalik haqida so'ralmoqda", en: "asking about ownership", ko: "소유에 대해 묻는 중" },
  whom: { uz: "kishi haqida so'ralmoqda", en: "asking about a person", ko: "사람에 대해 묻는 중" },
};

export function getWhWordMeaning(word: string): Trilingual | null {
  return WH_WORD_MEANING[word.trim().toLowerCase()] ?? null;
}
