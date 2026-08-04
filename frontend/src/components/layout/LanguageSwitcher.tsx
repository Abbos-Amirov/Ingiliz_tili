"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocale } from "@/hooks/useT";
import { localeLabels, type Locale } from "@/lib/i18n/translations";

const locales: Locale[] = ["uz", "en", "ko"];

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Til / Language / 언어"
        className="flex items-center gap-1.5 min-h-10 px-2.5 rounded-lg text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-surface-muted transition-colors"
      >
        <span className="text-base leading-none">{localeLabels[locale].flag}</span>
        <span className="hidden sm:inline">{localeLabels[locale].name}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-40 rounded-xl border border-border bg-surface card-shadow overflow-hidden z-50"
          >
            {locales.map((l) => (
              <button
                key={l}
                onClick={() => {
                  setLocale(l);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm font-medium text-left transition-colors ${
                  l === locale ? "bg-surface-muted text-primary" : "text-foreground/80 hover:bg-surface-muted"
                }`}
              >
                <span className="text-base leading-none">{localeLabels[l].flag}</span>
                {localeLabels[l].name}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
