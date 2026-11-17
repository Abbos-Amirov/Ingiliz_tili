"use client";

import { useLocale, useT } from "@/hooks/useT";
import { pick, type TextbookLesson, type TransformCard } from "@/lib/textbook";
import { PronunciationButton } from "./PronunciationButton";

// One sentence with its 🔊 — the textbook's sentence card line.
export function SentenceLine({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-between gap-2 py-1.5">
      <span className="font-semibold leading-snug">{text}</span>
      <PronunciationButton text={text} size="sm" />
    </div>
  );
}

function Card({ card, highlight }: { card: TransformCard; highlight?: boolean }) {
  const t = useT("textbook");
  const { locale } = useLocale();
  const rule = pick(locale, card.ruleKo, card.ruleUz);
  const note = pick(locale, card.noteKo, card.noteUz);
  return (
    <div
      className={`rounded-2xl border overflow-hidden flex flex-col ${
        highlight ? "border-ink bg-surface ring-2 ring-ink/80" : "border-border bg-surface"
      }`}
    >
      <div className={`px-4 py-2.5 flex items-center justify-between gap-2 ${highlight ? "bg-ink text-on-ink" : "bg-primary/10"}`}>
        <span className="font-bold text-sm">{t.transforms[card.transform]}</span>
        {rule && (
          <span
            className={`text-[11px] font-bold rounded-full px-2 py-0.5 ${
              highlight ? "bg-white/10 text-gold" : "bg-accent-soft text-accent"
            }`}
          >
            {rule}
          </span>
        )}
      </div>
      <div className="px-4 py-2 flex-1 divide-y divide-border/60">
        {card.sentences.map((s) => (
          <SentenceLine key={s} text={s} />
        ))}
      </div>
      {note && <p className="px-4 pb-3 text-xs text-foreground/55">{note}</p>}
    </div>
  );
}

// 변형 한눈에 보기 — ① sentence shape (→) and ② subject & tense (↓).
export function TransformOverview({ lesson }: { lesson: TextbookLesson }) {
  const t = useT("textbook");
  const { locale } = useLocale();
  return (
    <div className="space-y-6">
      <div>
        <h4 className="font-bold mb-3 flex items-center gap-2">
          <span className="h-6 w-6 rounded-full bg-ink text-gold text-xs flex items-center justify-center">1</span>
          {t.shapeTitle} <span className="text-foreground/40">→</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {lesson.shapeTransforms.map((c) => (
            <Card key={c.transform} card={c} highlight={c.transform === "base"} />
          ))}
        </div>
      </div>
      <div>
        <h4 className="font-bold mb-3 flex items-center gap-2">
          <span className="h-6 w-6 rounded-full bg-ink text-gold text-xs flex items-center justify-center">2</span>
          {t.subjectTenseTitle} <span className="text-foreground/40">↓</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {lesson.subjectTenseTransforms.map((c) => (
            <Card key={c.transform} card={c} />
          ))}
        </div>
      </div>
      {lesson.imperative && (
        <div className="rounded-2xl border border-accent/30 bg-accent-soft/50 p-4">
          <p className="font-bold text-accent mb-2">{t.imperativeTitle}</p>
          <p className="text-sm text-foreground/70 mb-2">{pick(locale, lesson.imperative.ruleKo, lesson.imperative.ruleUz)}</p>
          <div className="flex flex-wrap gap-2">
            {[...lesson.imperative.examples, lesson.imperative.dontExample].filter(Boolean).map((s) => (
              <span key={s} className="inline-flex items-center gap-1.5 rounded-xl bg-surface border border-border pl-3 pr-1 py-1 font-semibold">
                {s} <PronunciationButton text={s} size="sm" />
              </span>
            ))}
          </div>
          <p className="text-xs text-foreground/60 mt-2">{pick(locale, lesson.imperative.dontRuleKo, lesson.imperative.dontRuleUz)}</p>
        </div>
      )}
    </div>
  );
}
