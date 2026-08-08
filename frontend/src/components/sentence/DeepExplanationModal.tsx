"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Modal } from "@/components/ui/Modal";
import { FunctionWordModal } from "@/components/functionWords/FunctionWordModal";
import { useT, useLocale } from "@/hooks/useT";
import { useGrammarTopics } from "@/hooks/useGrammarTopics";
import { apiFetch } from "@/lib/api";
import { ROLE_COLORS } from "@/lib/roleColors";
import type { FunctionWord, GrammarRole, Sentence } from "@/lib/types";

const ROLE_EMOJI: Record<GrammarRole, string> = {
  subject: "🔵",
  verb: "🟢",
  auxiliary: "⚪",
  object: "🟠",
  adjective: "🟣",
  adverb: "🌸",
  preposition: "🔷",
  conjunction: "🔴",
  article: "⬛",
  pronoun: "🩵",
  interjection: "🟡",
};

/** Opt-in, per-sentence "how is this built?" breakdown shown after a
 * Sentence Building exercise is completed correctly (see FEATURE 1, "Gap
 * tahlili"). Nests FunctionWordModal for any word tagged with a
 * functionWordRef, and links out to the matching Grammar Hub topic (if any)
 * for this sentence's formula. */
export function DeepExplanationModal({
  sentence,
  open,
  onClose,
}: {
  sentence: Sentence;
  open: boolean;
  onClose: () => void;
}) {
  const t = useT("deepExplanation");
  const { locale } = useLocale();
  const { fetchTopics } = useGrammarTopics();
  const [grammarTopicId, setGrammarTopicId] = useState<string | null>(null);
  const [functionWords, setFunctionWords] = useState<FunctionWord[]>([]);
  const [openFunctionWord, setOpenFunctionWord] = useState<FunctionWord | null>(null);

  const needsFunctionWords = useMemo(
    () => (sentence.deepExplanation?.wordBreakdown ?? []).some((wb) => wb.functionWordRef),
    [sentence],
  );

  useEffect(() => {
    if (!open) return;
    if (sentence.formula) {
      fetchTopics()
        .then((res) => {
          const match = res.topics.find((tp) => tp.formula === sentence.formula);
          setGrammarTopicId(match?._id ?? null);
        })
        .catch(() => {});
    }
    if (needsFunctionWords) {
      apiFetch<{ functionWords: FunctionWord[] }>("/function-words")
        .then((res) => setFunctionWords(res.functionWords))
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, sentence]);

  const explanation = sentence.deepExplanation;

  return (
    <>
      <Modal open={open} onClose={onClose} title={t.modalTitle}>
        {!explanation ? (
          <p className="text-sm text-foreground/60">{t.noContent}</p>
        ) : (
          <div className="space-y-5">
            <div className="rounded-xl bg-surface-muted p-3 text-center">
              <p className="font-bold">{sentence.words.map((w) => w.text).join(" ")}</p>
              <p className="text-sm text-foreground/60 mt-0.5">{sentence.korean}</p>
              {sentence.formula && (
                <p className="text-xs font-mono text-foreground/40 mt-1">
                  {t.formulaLabel}: {sentence.formula}
                </p>
              )}
            </div>

            <div className="space-y-3">
              {explanation.wordBreakdown.map((wb, i) => {
                const color = ROLE_COLORS[wb.role];
                return (
                  <div key={i} className="rounded-xl border border-border p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-lg leading-none">{ROLE_EMOJI[wb.role] ?? "🔹"}</span>
                      <span className="font-bold" style={{ color: color.text }}>
                        {wb.text}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                        style={{ backgroundColor: color.bg, color: color.text }}
                      >
                        {color.label}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed">{wb.simpleExplanation[locale]}</p>
                    {wb.moreExamples.length > 0 && (
                      <ul className="mt-1.5 space-y-0.5">
                        {wb.moreExamples.map((ex, j) => (
                          <li key={j} className="text-xs text-foreground/50">
                            • {ex}
                          </li>
                        ))}
                      </ul>
                    )}
                    {wb.functionWordRef && (
                      <button
                        type="button"
                        onClick={() => {
                          const match = functionWords.find((fw) => fw.word === wb.functionWordRef);
                          if (match) setOpenFunctionWord(match);
                        }}
                        className="mt-2 text-xs font-semibold text-accent hover:underline"
                      >
                        ℹ️ &quot;{wb.functionWordRef}&quot; {t.functionWordLink}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {explanation.generalRule[locale] && (
              <div className="rounded-xl bg-accent-soft p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-foreground/50 mb-1">
                  {t.generalRuleTitle}
                </p>
                <p className="text-sm">{explanation.generalRule[locale]}</p>
              </div>
            )}

            {explanation.practiceExamples.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-foreground/50 mb-2">{t.practiceTitle}</p>
                <ul className="space-y-1">
                  {explanation.practiceExamples.map((ex, i) => (
                    <li key={i} className="text-sm rounded-lg bg-surface-muted px-3 py-2">
                      {ex}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {grammarTopicId && (
              <Link
                href={`/grammar/${grammarTopicId}`}
                className="block text-center text-sm font-semibold text-primary hover:underline"
              >
                {t.grammarHubLink}
              </Link>
            )}
          </div>
        )}
      </Modal>
      <FunctionWordModal functionWord={openFunctionWord} onClose={() => setOpenFunctionWord(null)} />
    </>
  );
}
