import type { Locale } from "./i18n/translations";
import type { Word, Sentence, IrregularVerb, FunctionWord } from "./types";
import type { SpeechLang } from "./tts";

// This app originally taught English via Korean only — every learning
// model (Word, Sentence, IrregularVerb, FunctionWord) still carries that
// `korean` field. It now also supports Uzbek learners, via a parallel
// `uzbek` field on each — this is the one rule for picking between them,
// used everywhere content is shown to a learner (not UI chrome, which
// already follows the locale switcher via useT/translations.ts):
//   - locale "uz" -> show the Uzbek field (falls back to Korean if a
//     not-yet-backfilled document has an empty one)
//   - locale "en" or "ko" -> show Korean, unchanged from before this
//     feature existed
export function isUzbekContentLocale(locale: Locale): boolean {
  return locale === "uz";
}

export function wordTranslation(word: Pick<Word, "korean" | "uzbek">, locale: Locale): string {
  return isUzbekContentLocale(locale) ? word.uzbek || word.korean : word.korean;
}

export function wordExampleSentence(
  word: Pick<Word, "exampleSentenceKo" | "exampleSentenceUz">,
  locale: Locale,
): string {
  return isUzbekContentLocale(locale) ? word.exampleSentenceUz || word.exampleSentenceKo : word.exampleSentenceKo;
}

export function sentenceTranslation(sentence: Pick<Sentence, "korean" | "uzbek">, locale: Locale): string {
  return isUzbekContentLocale(locale) ? sentence.uzbek || sentence.korean : sentence.korean;
}

export function irregularVerbTranslation(verb: Pick<IrregularVerb, "korean" | "uzbek">, locale: Locale): string {
  return isUzbekContentLocale(locale) ? verb.uzbek || verb.korean : verb.korean;
}

export function functionWordTranslation(fw: Pick<FunctionWord, "korean" | "uzbek">, locale: Locale): string {
  return isUzbekContentLocale(locale) ? fw.uzbek || fw.korean : fw.korean;
}

// For playAudio(url, fallbackText, fallbackLang) call sites: no
// pre-generated Uzbek pronunciation clips exist (unlike Korean's
// koreanAudioUrl), so Uzbek always falls back to the browser's
// speechSynthesis — which in turn may have no Uzbek voice installed on a
// given device, a known limitation, not a bug to chase here.
export function contentAudioUrl(koreanAudioUrl: string | null | undefined, locale: Locale): string | null {
  return isUzbekContentLocale(locale) ? null : (koreanAudioUrl ?? null);
}

export function contentSpeechLang(locale: Locale): SpeechLang {
  return isUzbekContentLocale(locale) ? "uz-UZ" : "ko-KR";
}
