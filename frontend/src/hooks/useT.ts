"use client";

import { useLocaleStore } from "@/store/locale";
import { translations, type TranslationDict } from "@/lib/i18n/translations";

export function useT<K extends keyof TranslationDict>(namespace: K): TranslationDict[K] {
  const locale = useLocaleStore((s) => s.locale);
  return translations[locale][namespace];
}

export function useLocale() {
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  return { locale, setLocale };
}
