"use client";

import { useAdminLocale, useAdminT } from "@/hooks/useAdminT";
import type { AdminLocale } from "@/store/adminLocale";

const OPTIONS: { value: AdminLocale; label: string }[] = [
  { value: "en", label: "EN" },
  { value: "uz", label: "UZ" },
];

// EN / UZ segmented switch for the admin panel's own UI language.
export function AdminLangToggle({ className = "" }: { className?: string }) {
  const { locale, setLocale } = useAdminLocale();
  const t = useAdminT("shell");
  return (
    <div role="group" aria-label={t.language} className={`inline-flex rounded-full bg-[#f3effd] p-1 dark:bg-surface-muted ${className}`}>
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => setLocale(o.value)}
          aria-pressed={locale === o.value}
          className={`rounded-full px-3 py-1 text-xs font-extrabold transition-colors ${
            locale === o.value ? "bg-[#5b21b6] text-white shadow" : "text-foreground/60 hover:text-foreground"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
