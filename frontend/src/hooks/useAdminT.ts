"use client";

import { useAdminLocaleStore } from "@/store/adminLocale";
import { adminTranslations, type AdminDict } from "@/lib/i18n/admin";

export function useAdminT<K extends keyof AdminDict>(namespace: K): AdminDict[K] {
  const locale = useAdminLocaleStore((s) => s.locale);
  return adminTranslations[locale][namespace];
}

export function useAdminLocale() {
  const locale = useAdminLocaleStore((s) => s.locale);
  const setLocale = useAdminLocaleStore((s) => s.setLocale);
  return { locale, setLocale };
}

/** Fills "{name}" placeholders: tf("Hi {name}", { name: "Abbos" }). */
export function tf(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => (k in vars ? String(vars[k]) : `{${k}}`));
}
