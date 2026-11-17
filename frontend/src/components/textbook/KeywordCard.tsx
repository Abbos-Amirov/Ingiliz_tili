"use client";

import { useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { useLocale, useT } from "@/hooks/useT";
import { pick, type TextbookKeyword } from "@/lib/textbook";
import { PronunciationButton } from "./PronunciationButton";

// One keyword with 🔊 and "🏰 Saroyga qo'shish" (quick-add to the Memory
// Palace, then optionally attach a photo on the palace's create page).
export function KeywordCard({
  keyword,
  status,
}: {
  keyword: TextbookKeyword;
  status: { wordId: string | null; inPalace: boolean } | undefined;
}) {
  const t = useT("textbook");
  const { locale } = useLocale();
  const [inPalace, setInPalace] = useState(status?.inPalace ?? false);
  const [wordId, setWordId] = useState<string | null>(status?.wordId ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function addToPalace() {
    setBusy(true);
    setError(false);
    try {
      const res = await apiFetch<{ wordId: string }>("/memory-anchors/quick-add", {
        method: "POST",
        body: JSON.stringify({ word: keyword.word }),
      });
      setWordId(res.wordId);
      setInPalace(true);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-3.5 flex flex-col gap-2.5">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-lg leading-tight">
            {keyword.word}{" "}
            <span className="text-xs font-semibold text-foreground/45">({keyword.pronunciationKo})</span>
          </p>
          <p className="text-sm text-foreground/65 mt-0.5">{pick(locale, keyword.korean, keyword.uzbek)}</p>
        </div>
        <PronunciationButton text={keyword.word} />
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={addToPalace}
          disabled={inPalace || busy}
          className={`text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors ${
            inPalace
              ? "bg-success-soft text-success cursor-default"
              : "bg-ink text-on-ink hover:bg-ink-soft disabled:opacity-60"
          }`}
        >
          🏰 {inPalace ? t.inPalace : t.addToPalace}
        </button>
        {inPalace && wordId && (
          <Link
            href={`/memory-palace/create?wordId=${wordId}`}
            className="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-accent-soft text-accent hover:brightness-95"
          >
            📷 {t.attachPhoto}
          </Link>
        )}
        {error && <span className="text-xs text-danger">{t.palaceError}</span>}
      </div>
    </div>
  );
}
