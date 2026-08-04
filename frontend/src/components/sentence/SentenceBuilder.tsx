"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Sentence } from "@/lib/types";
import { WordChip } from "./WordChip";
import { Button } from "@/components/ui/Button";
import { speak } from "@/lib/tts";
import { useT } from "@/hooks/useT";

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
    const all = [...sentence.englishWords, ...sentence.distractorWords];
    return shuffle(all.map((text, i) => ({ key: `${text}-${i}`, text })));
  }, [sentence]);

  const [remaining, setRemaining] = useState<PoolItem[]>(pool);
  const [placed, setPlaced] = useState<PoolItem[]>([]);
  const [wrongKey, setWrongKey] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function handlePick(item: PoolItem) {
    if (wrongKey || done) return;
    const expected = sentence.englishWords[placed.length];
    if (item.text === expected) {
      const nextPlaced = [...placed, item];
      setPlaced(nextPlaced);
      setRemaining((prev) => prev.filter((p) => p.key !== item.key));
      setHint(null);
      if (nextPlaced.length === sentence.englishWords.length) {
        setDone(true);
        speak(sentence.englishWords.join(" "), "en-US");
      }
    } else {
      setWrongKey(item.key);
      setHint(t.wrongHint);
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

      <div className="mt-6 min-h-16 rounded-2xl border-2 border-dashed border-border p-4 flex flex-wrap gap-2 items-center justify-center">
        <AnimatePresence>
          {placed.length === 0 && <span className="text-foreground/40 text-sm">{t.placeholder}</span>}
          {placed.map((item, i) => (
            <WordChip
              key={item.key}
              text={item.text}
              variant={done ? "placed" : "placed"}
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

      <div className="mt-6 flex flex-wrap gap-2.5 justify-center">
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
                variant={item.key === wrongKey ? "wrong" : "pool"}
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
          <Button onClick={onComplete}>{t.nextBtn}</Button>
        </motion.div>
      )}
    </div>
  );
}
