"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Word } from "@/lib/types";
import { MatchWordTile } from "@/components/match/MatchWordTile";
import { Button } from "@/components/ui/Button";
import { MotivationToast } from "@/components/ui/MotivationToast";
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

interface Tile {
  key: string;
  text: string;
}

// A lighter sibling of SentenceBuilder for the example sentence every word
// already carries (word.exampleSentenceEn/Ko) — no grammar-role tags or
// distractors exist for these (unlike the curated Sentence collection), so
// this is plain tap-the-words-in-order with no role coloring or formula bar.
export function WordSentenceBuilder({ word, onComplete }: { word: Word; onComplete: () => void }) {
  const t = useT("sentence");

  const targetWords = useMemo(() => word.exampleSentenceEn.trim().split(/\s+/), [word]);
  const pool = useMemo(
    () => shuffle(targetWords.map((text, i) => ({ key: `${text}-${i}`, text }))),
    [targetWords],
  );

  const [remaining, setRemaining] = useState<Tile[]>(pool);
  const [placed, setPlaced] = useState<Tile[]>([]);
  const [wrongKey, setWrongKey] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [motivationSignal, setMotivationSignal] = useState(0);

  function handlePick(item: Tile) {
    if (wrongKey || done) return;
    const expected = targetWords[placed.length];
    if (item.text === expected) {
      const nextPlaced = [...placed, item];
      setPlaced(nextPlaced);
      setRemaining((prev) => prev.filter((p) => p.key !== item.key));
      if (nextPlaced.length === targetWords.length) {
        setDone(true);
        setMotivationSignal((s) => s + 1);
        speak(word.exampleSentenceEn, "en-US");
      }
    } else {
      setWrongKey(item.key);
      window.setTimeout(() => setWrongKey(null), 400);
    }
  }

  function handleUndo(index: number) {
    if (done) return;
    setPlaced((prev) => prev.slice(0, index));
    setRemaining((prev) => [...prev, ...placed.slice(index)]);
  }

  return (
    <div className="w-full">
      <MotivationToast signal={motivationSignal} />
      <div className="rounded-2xl bg-surface-muted border border-border p-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-foreground/50 mb-2">{t.koreanSentenceLabel}</p>
        <p className="text-xl sm:text-2xl font-bold">{word.exampleSentenceKo}</p>
      </div>

      <div className="mt-6 min-h-16 rounded-2xl border-2 border-dashed border-border p-4 flex flex-wrap gap-3 items-start justify-center">
        <AnimatePresence>
          {placed.length === 0 && <span className="text-foreground/40 text-sm mt-2.5">{t.placeholder}</span>}
          {placed.map((item, i) => (
            <motion.button
              key={item.key}
              type="button"
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => handleUndo(i)}
              disabled={done}
              className="px-4 py-2.5 rounded-xl border-2 border-success bg-success-soft text-success font-semibold text-sm sm:text-base disabled:cursor-default"
            >
              {item.text}
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      <div className="mt-6 flex flex-wrap gap-3 justify-center">
        <AnimatePresence>
          {remaining.map((item) => (
            <motion.div key={item.key} layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
              <MatchWordTile
                text={item.text}
                state={item.key === wrongKey ? "wrong" : "idle"}
                onClick={() => handlePick(item)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {done && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 flex flex-col items-center gap-3">
          <p className="text-success font-bold text-lg">{t.correct}</p>
          <p className="text-sm text-center max-w-md text-foreground/70">{word.exampleSentenceEn}</p>
          <Button onClick={onComplete}>{t.nextBtn}</Button>
        </motion.div>
      )}
    </div>
  );
}
