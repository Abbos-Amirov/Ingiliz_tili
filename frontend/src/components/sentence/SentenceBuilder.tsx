"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Sentence, GrammarRole } from "@/lib/types";
import { WordChip } from "./WordChip";
import { FormulaBar } from "./FormulaBar";
import { DeepExplanationModal } from "./DeepExplanationModal";
import { Button } from "@/components/ui/Button";
import { MotivationToast } from "@/components/ui/MotivationToast";
import { playAudio } from "@/lib/tts";
import { useT } from "@/hooks/useT";
import { ROLE_COLORS } from "@/lib/roleColors";

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

interface PoolItem {
  key: string;
  text: string;
  role: GrammarRole;
  audioUrl?: string | null;
}

export function SentenceBuilder({
  sentence,
  onComplete,
}: {
  sentence: Sentence;
  onComplete: () => void;
}) {
  const t = useT("sentence");
  const td = useT("deepExplanation");
  const pool = useMemo(() => {
    const all = [...sentence.words, ...sentence.distractorWords];
    return shuffle(all.map((rw, i) => ({ key: `${rw.text}-${i}`, text: rw.text, role: rw.role, audioUrl: rw.audioUrl })));
  }, [sentence]);

  const [remaining, setRemaining] = useState<PoolItem[]>(pool);
  const [placed, setPlaced] = useState<PoolItem[]>([]);
  const [wrongKey, setWrongKey] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [tempLabelsOn, setTempLabelsOn] = useState(false);
  const [pulseKey, setPulseKey] = useState(0);
  const [motivationSignal, setMotivationSignal] = useState(0);
  const [explanationOpen, setExplanationOpen] = useState(false);

  const showLabels =
    sentence.level === "beginner" ? true : sentence.level === "advanced" ? false : tempLabelsOn;

  function handlePick(item: PoolItem) {
    if (wrongKey || done) return;
    playAudio(item.audioUrl, item.text, "en-US");
    const expected = sentence.words[placed.length];
    if (item.text === expected.text) {
      const nextPlaced = [...placed, item];
      setPlaced(nextPlaced);
      setRemaining((prev) => prev.filter((p) => p.key !== item.key));
      setHint(null);
      setPulseKey((k) => k + 1);
      if (nextPlaced.length === sentence.words.length) {
        setDone(true);
        setMotivationSignal((s) => s + 1);
        playAudio(sentence.audioUrl, sentence.words.map((w) => w.text).join(" "), "en-US");
      }
    } else {
      setWrongKey(item.key);
      setHint(t.wrongHint);
      if (sentence.level === "intermediate") {
        setTempLabelsOn(true);
        window.setTimeout(() => setTempLabelsOn(false), 2000);
      }
      window.setTimeout(() => {
        setWrongKey(null);
      }, 400);
    }
  }

  function handleUndo(item: PoolItem, index: number) {
    if (done) return;
    setPlaced((prev) => prev.slice(0, index));
    setRemaining((prev) => [...prev, ...placed.slice(index)]);
    setHint(null);
  }

  return (
    <div className="w-full">
      <MotivationToast signal={motivationSignal} />
      <div className="rounded-2xl bg-surface-muted border border-border p-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-foreground/50 mb-2">
          {t.koreanSentenceLabel}
        </p>
        <p className="text-xl sm:text-2xl font-bold">{sentence.korean}</p>
      </div>

      {sentence.formula && (
        <div className="mt-4">
          <FormulaBar formula={sentence.formula} pulseKey={pulseKey} />
        </div>
      )}

      <div className="relative mt-6">
        {done && (
          <button
            type="button"
            onClick={() => playAudio(sentence.audioUrl, sentence.words.map((w) => w.text).join(" "), "en-US")}
            aria-label={t.replayAudio}
            title={t.replayAudio}
            className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10 h-8 w-8 flex items-center justify-center rounded-full bg-success text-white shadow-md shadow-success/30 hover:brightness-105 transition-all"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
          </button>
        )}
        <div className="min-h-16 rounded-2xl border-2 border-dashed border-border p-4 flex flex-wrap gap-3 items-start justify-center">
          <AnimatePresence>
            {placed.length === 0 && <span className="text-foreground/40 text-sm mt-2.5">{t.placeholder}</span>}
            {placed.map((item, i) => (
              <WordChip
                key={item.key}
                text={item.text}
                role={item.role}
                variant="placed"
                showLabel={showLabels || done}
                onClick={() => handleUndo(item, i)}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {hint && (
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-3 text-center text-sm text-danger font-medium"
          >
            {hint}
          </motion.p>
        )}
      </AnimatePresence>

      <div className="mt-6 flex flex-wrap gap-3 justify-center">
        <AnimatePresence>
          {remaining.map((item) => (
            <motion.div
              key={item.key}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <WordChip
                text={item.text}
                role={item.role}
                variant={item.key === wrongKey ? "wrong" : "pool"}
                showLabel={showLabels}
                onClick={() => handlePick(item)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {done && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 flex flex-col items-center gap-3"
        >
          <p className="text-success font-bold text-lg">{t.correct}</p>
          <p className="text-sm text-center max-w-md leading-relaxed">
            {sentence.words.map((rw, i) => (
              <span key={i}>
                {i > 0 && <span className="text-foreground/30"> + </span>}
                <span style={{ color: ROLE_COLORS[rw.role].text }} className="font-semibold">
                  &quot;{rw.text}&quot;
                </span>
                <span className="text-foreground/50"> ({ROLE_COLORS[rw.role].label})</span>
              </span>
            ))}
          </p>
          {sentence.deepExplanation && (
            <button
              type="button"
              onClick={() => setExplanationOpen(true)}
              className="text-xs font-medium text-foreground/50 hover:text-foreground underline underline-offset-2"
            >
              {td.triggerBtn}
            </button>
          )}
          <Button onClick={onComplete}>{t.nextBtn}</Button>
        </motion.div>
      )}

      <DeepExplanationModal sentence={sentence} open={explanationOpen} onClose={() => setExplanationOpen(false)} />
    </div>
  );
}
