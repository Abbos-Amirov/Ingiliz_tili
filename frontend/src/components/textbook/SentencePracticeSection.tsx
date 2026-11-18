"use client";

import { useState } from "react";
import { useLocale, useT } from "@/hooks/useT";
import { pick, type FreeTalkQuestion, type PracticeSentence } from "@/lib/textbook";
import { PronunciationButton } from "./PronunciationButton";

// 문장 연습 — read aloud, check the meaning; then "hide English" to practise
// saying each sentence from its translation (tap a row to peek).
export function SentencePracticeSection({ sentences }: { sentences: PracticeSentence[] }) {
  const t = useT("textbook");
  const { locale } = useLocale();
  const [hidden, setHidden] = useState(false);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface card-shadow">
      <div className="flex items-center justify-end border-b border-border px-4 py-2.5">
        <button
          type="button"
          onClick={() => {
            setHidden((h) => !h);
            setRevealed(new Set());
          }}
          className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
            hidden ? "bg-ink text-on-ink" : "bg-surface-muted text-foreground/70 hover:bg-primary/10"
          }`}
        >
          {hidden ? `👀 ${t.showEnglish}` : `🙈 ${t.hideEnglish}`}
        </button>
      </div>
      <ol>
        {sentences.map((s, i) => {
          const show = !hidden || revealed.has(s.key);
          return (
            <li key={s.key} className="flex items-start gap-3 border-t border-border px-4 py-3 first:border-t-0">
              <span className="mt-0.5 w-6 shrink-0 text-xs font-bold text-foreground/40">{String(i + 1).padStart(2, "0")}</span>
              <div className="min-w-0 flex-1">
                {show ? (
                  <p className="font-semibold leading-snug">
                    {s.english} <span className="text-xs font-normal text-foreground/40">{s.pronunciationKo}</span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => setRevealed((r) => new Set(r).add(s.key))}
                    className="rounded-lg bg-surface-muted px-3 py-1 text-xs font-bold text-foreground/50"
                  >
                    ••• {t.tapToReveal}
                  </button>
                )}
                <p className="mt-0.5 text-sm text-foreground/65">{pick(locale, s.korean, s.uzbek)}</p>
              </div>
              <PronunciationButton text={s.english} size="sm" />
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// 프리토킹 — open questions on the day's topic.
export function FreeTalkSection({ questions }: { questions: FreeTalkQuestion[] }) {
  const { locale } = useLocale();
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {questions.map((q, i) => (
        <div key={q.key} className="relative overflow-hidden rounded-2xl ink-panel p-5">
          <span className="font-serif text-sm font-bold text-gold">Q{i + 1}</span>
          <div className="mt-1 flex items-start justify-between gap-2">
            <p className="text-lg font-bold leading-snug text-on-ink">{q.question}</p>
            <PronunciationButton text={q.question} size="sm" />
          </div>
          <p className="mt-1 text-xs text-on-ink/50">{q.pronunciationKo}</p>
          <p className="mt-2 text-sm text-on-ink/80">{pick(locale, q.meaningKo, q.meaningUz)}</p>
        </div>
      ))}
    </div>
  );
}
