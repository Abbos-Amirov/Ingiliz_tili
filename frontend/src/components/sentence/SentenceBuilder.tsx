"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Sentence, GrammarRole } from "@/lib/types";
import { WordChip } from "./WordChip";
import { FormulaBar } from "./FormulaBar";
import { Button } from "@/components/ui/Button";
import { speak } from "@/lib/tts";
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
}

export function SentenceBuilder({
  sentence,
  onComplete,
}: {
  sentence: Sentence;
  onComplete: () => void;
}) {
  const t = useT("sentence");
  const pool = useMemo(() => {
    const all = [...sentence.words, ...sentence.distractorWords];
    return shuffle(all.map((rw, i) => ({ key: `${rw.text}-${i}`, text: rw.text, role: rw.role })));
  }, [sentence]);

  const [remaining, setRemaining] = useState<PoolItem[]>(pool);
  const [placed, setPlaced] = useState<PoolItem[]>([]);
  const [wrongKey, setWrongKey] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [tempLabelsOn, setTempLabelsOn] = useState(false);
  const [pulseKey, setPulseKey] = useState(0);

  const showLabels =
    sentence.level === "beginner" ? true : sentence.level === "advanced" ? false : tempLabelsOn;

  function handlePick(item: PoolItem) {
    if (wrongKey || done) return;
    const expected = sentence.words[placed.length];
    if (item.text === expected.text) {
      const nextPlaced = [...placed, item];
      setPlaced(nextPlaced);
      setRemaining((prev) => prev.filter((p) => p.key !== item.key));
      setHint(null);
      setPulseKey((k) => k + 1);
      if (nextPlaced.length === sentence.words.length) {
        setDone(true);
        speak(sentence.words.map((w) => w.text).join(" "), "en-US");
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

      <div className="mt-6 min-h-16 rounded-2xl border-2 border-dashed border-border p-4 flex flex-wrap gap-3 items-start justify-center">
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
          <Button onClick={onComplete}>{t.nextBtn}</Button>
        </motion.div>
      )}
    </div>
  );
}
