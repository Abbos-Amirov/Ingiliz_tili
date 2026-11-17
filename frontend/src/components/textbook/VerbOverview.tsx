"use client";

import { useLocale, useT } from "@/hooks/useT";
import { pick, type TextbookLesson, type VerbType } from "@/lib/textbook";
import { PronunciationButton } from "./PronunciationButton";

export const VERB_TYPE_STYLE: Record<VerbType, { dot: string; tile: string; text: string }> = {
  be_verb: { dot: "bg-emerald-500", tile: "bg-emerald-500/10", text: "text-emerald-700 dark:text-emerald-300" },
  general_verb: { dot: "bg-primary", tile: "bg-primary/10", text: "text-primary" },
  modal_verb: { dot: "bg-sky-500", tile: "bg-sky-500/10", text: "text-sky-700 dark:text-sky-300" },
};

// 동사 한눈에 보기 — the three verb families with their base sentences.
export function VerbOverview({ lesson }: { lesson: TextbookLesson }) {
  const t = useT("textbook");
  const { locale } = useLocale();
  return (
    <div className="rounded-3xl border border-border bg-surface card-shadow overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h3 className="font-bold text-lg">{t.verbOverviewTitle}</h3>
        <p className="text-sm text-foreground/60">{t.verbOverviewSubtitle}</p>
      </div>
      <div className="grid sm:grid-cols-[150px_1fr]">
        <div className="hidden sm:flex flex-col items-center justify-center gap-1 bg-primary/5 p-4 text-center border-r border-border">
          <p className="font-serif text-2xl font-bold">{t.pos.verb}</p>
          <p className="text-xs text-foreground/60">{t.verbCore}</p>
        </div>
        <div className="divide-y divide-border">
          {lesson.verbTypes.map((v) => {
            const style = VERB_TYPE_STYLE[v.type];
            return (
              <div key={v.type} className="grid grid-cols-[96px_1fr] sm:grid-cols-[110px_1fr_170px] items-center">
                <div className={`self-stretch flex items-center justify-center px-2 py-3 ${style.tile}`}>
                  <span className={`font-bold text-sm text-center ${style.text}`}>{t.verbTypes[v.type]}</span>
                </div>
                <div className="px-4 py-3">
                  <p className="text-sm font-semibold">{pick(locale, v.meaningKo, v.meaningUz)}</p>
                  <p className="text-xs text-foreground/55 mt-0.5">{v.examples.join(" · ")}</p>
                </div>
                <div className="col-span-2 sm:col-span-1 flex items-center justify-between gap-2 px-4 pb-3 sm:py-3 sm:border-l border-border">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-foreground/45 font-bold">{t.baseSentence}</p>
                    <p className="font-bold">{v.baseSentence}</p>
                  </div>
                  <PronunciationButton text={v.baseSentence} size="sm" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <p className="px-5 py-3 text-sm bg-accent-soft/60 border-t border-border">
        <span className="font-bold text-accent">✦ {t.ruleLabel}: </span>
        {pick(locale, lesson.verbRuleKo, lesson.verbRuleUz)}
      </p>
    </div>
  );
}
