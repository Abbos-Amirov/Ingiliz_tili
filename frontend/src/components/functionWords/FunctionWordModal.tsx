"use client";

import { Modal } from "@/components/ui/Modal";
import { useT } from "@/hooks/useT";
import { playAudio } from "@/lib/tts";
import type { FunctionWord } from "@/lib/types";

/** Full explanation for a single function word (preposition/article/question
 * word) — reusable both from the /function-words glossary page and, nested
 * on top of it, from the Sentence Building "Deep Explanation" popup when a
 * word's functionWordRef is tapped. */
export function FunctionWordModal({ functionWord, onClose }: { functionWord: FunctionWord | null; onClose: () => void }) {
  const t = useT("functionWords");

  return (
    <Modal open={Boolean(functionWord)} onClose={onClose} title={functionWord?.word ?? ""}>
      {functionWord && (
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              {functionWord.korean && <p className="text-foreground/60 text-sm">{functionWord.korean}</p>}
              {functionWord.simpleExplanation && (
                <p className="text-sm leading-relaxed mt-1">{functionWord.simpleExplanation}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => playAudio(functionWord.audioUrl, functionWord.word, "en-US")}
              aria-label="play"
              className="shrink-0 h-9 w-9 flex items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/15"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              </svg>
            </button>
          </div>

          {functionWord.usageTypes.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-foreground/50 mb-2">{t.usageTypesTitle}</p>
              <div className="space-y-2">
                {functionWord.usageTypes.map((ut, i) => (
                  <div key={i} className="rounded-xl bg-surface-muted p-3">
                    <p className="font-semibold text-sm">{ut.meaning}</p>
                    <p className="text-sm text-foreground/70 mt-0.5">{ut.example}</p>
                    {ut.note && <p className="text-xs text-foreground/50 mt-0.5">{ut.note}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {functionWord.commonMistakes.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-foreground/50 mb-2">{t.commonMistakesTitle}</p>
              <div className="space-y-2">
                {functionWord.commonMistakes.map((cm, i) => (
                  <div key={i} className="rounded-xl bg-danger-soft p-3 text-sm">
                    <p className="text-danger">
                      {t.wrongLabel}: {cm.wrong}
                    </p>
                    <p className="text-success mt-0.5">
                      {t.correctLabel}: {cm.correct}
                    </p>
                    <p className="text-foreground/60 text-xs mt-1">{cm.explanation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
