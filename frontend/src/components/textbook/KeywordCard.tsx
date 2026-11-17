"use client";

import { useLocale } from "@/hooks/useT";
import { pick, type TextbookKeyword } from "@/lib/textbook";
import { PronunciationButton } from "./PronunciationButton";

// One textbook keyword with its 🔊. (Every keyword is also saved to the
// app's vocabulary automatically on the server — see backend
// textbook.service.ts ensureKeywordWords — so no "add" button is needed.)
export function KeywordCard({ keyword }: { keyword: TextbookKeyword }) {
  const { locale } = useLocale();
  return (
    <div className="rounded-2xl border border-border bg-surface p-3.5 flex items-center gap-2">
      <div className="flex-1 min-w-0">
        <p className="font-bold text-lg leading-tight">
          {keyword.word} <span className="text-xs font-semibold text-foreground/45">({keyword.pronunciationKo})</span>
        </p>
        <p className="text-sm text-foreground/65 mt-0.5">{pick(locale, keyword.korean, keyword.uzbek)}</p>
      </div>
      <PronunciationButton text={keyword.word} />
    </div>
  );
}
