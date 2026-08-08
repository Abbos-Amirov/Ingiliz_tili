"use client";

import type { Trilingual } from "@/lib/types";
import { localeLabels } from "@/lib/i18n/translations";

const LOCALES: (keyof Trilingual)[] = ["uz", "en", "ko"];

const rowClass = "flex items-start gap-1.5";
const flagClass = "text-sm shrink-0 w-6 text-center pt-2";
const fieldBaseClass =
  "flex-1 rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary";

/** Three stacked single-line inputs (🇺🇿/🇬🇧/🇰🇷) editing a Trilingual value —
 * used wherever admin-authored prose must follow the app's language
 * switcher (see Trilingual in lib/types.ts). */
export function TrilingualInput({
  value,
  onChange,
  placeholder,
}: {
  value: Trilingual;
  onChange: (v: Trilingual) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      {LOCALES.map((locale) => (
        <div key={locale} className={rowClass}>
          <span className={flagClass}>{localeLabels[locale].flag}</span>
          <input
            value={value[locale]}
            onChange={(e) => onChange({ ...value, [locale]: e.target.value })}
            placeholder={placeholder}
            className={fieldBaseClass}
          />
        </div>
      ))}
    </div>
  );
}

export function TrilingualTextarea({
  value,
  onChange,
  placeholder,
}: {
  value: Trilingual;
  onChange: (v: Trilingual) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      {LOCALES.map((locale) => (
        <div key={locale} className={rowClass}>
          <span className={flagClass}>{localeLabels[locale].flag}</span>
          <textarea
            value={value[locale]}
            onChange={(e) => onChange({ ...value, [locale]: e.target.value })}
            placeholder={placeholder}
            className={`${fieldBaseClass} min-h-16`}
          />
        </div>
      ))}
    </div>
  );
}
