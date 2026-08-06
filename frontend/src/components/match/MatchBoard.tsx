"use client";

import { useCallback, useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { Word } from "@/lib/types";
import { MatchWordTile } from "./MatchWordTile";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";
import { MotivationToast } from "@/components/ui/MotivationToast";
import { speak } from "@/lib/tts";
import { useSrsActions } from "@/hooks/useSrsSession";
import { useT } from "@/hooks/useT";

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Re-shuffles only the slots not in `matched`, leaving locked pairs in place. */
function shuffleUnmatched(order: string[], matched: Set<string>): string[] {
  const openIndices = order.map((_, i) => i).filter((i) => !matched.has(order[i]));
  const openValues = shuffle(openIndices.map((i) => order[i]));
  const next = [...order];
  openIndices.forEach((idx, k) => {
    next[idx] = openValues[k];
  });
  return next;
}

export function MatchBoard({
  words,
  onRoundComplete,
}: {
  words: Word[];
  onRoundComplete: (words: Word[]) => void;
}) {
  const { submitReview } = useSrsActions();
  const t = useT("match");

  const wordsById = useMemo(() => new Map(words.map((w) => [w._id, w])), [words]);

  const [englishOrder, setEnglishOrder] = useState<string[]>(() => words.map((w) => w._id));
  // Right-column display order. On a correct match, the matched word swaps into
  // the same row index as its English pair, so the pair ends up side by side
  // instead of needing a diagonal connecting line.
  const [koreanOrder, setKoreanOrder] = useState<string[]>(() => shuffle(words).map((w) => w._id));

  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [wrongIds, setWrongIds] = useState<Set<string>>(new Set());
  const [locked, setLocked] = useState(false);
  const [motivationSignal, setMotivationSignal] = useState(0);

  const attempt = useCallback(
    (leftId: string | null, rightId: string | null) => {
      if (!leftId || !rightId || locked) return;
      setLocked(true);
      if (leftId === rightId) {
        setKoreanOrder((prev) => {
          const targetIndex = englishOrder.indexOf(leftId);
          const currentIndex = prev.indexOf(leftId);
          if (currentIndex === -1 || targetIndex === -1 || currentIndex === targetIndex) return prev;
          const next = [...prev];
          [next[targetIndex], next[currentIndex]] = [next[currentIndex], next[targetIndex]];
          return next;
        });
        setMatched((prev) => new Set(prev).add(leftId));
        setSelectedLeft(null);
        setSelectedRight(null);
        setLocked(false);
        setMotivationSignal((s) => s + 1);
        submitReview(leftId, "correct").catch(() => {});
      } else {
        setWrongIds(new Set([leftId, rightId]));
        submitReview(leftId, "wrong").catch(() => {});
        submitReview(rightId, "wrong").catch(() => {});
        window.setTimeout(() => {
          setWrongIds(new Set());
          setSelectedLeft(null);
          setSelectedRight(null);
          setLocked(false);
        }, 400);
      }
    },
    [englishOrder, locked, submitReview],
  );

  function handleLeftClick(word: Word) {
    if (matched.has(word._id) || locked) return;
    speak(word.english, "en-US");
    setSelectedLeft(word._id);
    attempt(word._id, selectedRight);
  }

  function handleRightClick(word: Word) {
    if (matched.has(word._id) || locked) return;
    speak(word.korean, "ko-KR");
    setSelectedRight(word._id);
    attempt(selectedLeft, word._id);
  }

  function handleShuffle() {
    if (locked) return;
    setEnglishOrder((prev) => shuffleUnmatched(prev, matched));
    setKoreanOrder((prev) => shuffleUnmatched(prev, matched));
    setSelectedLeft(null);
    setSelectedRight(null);
  }

  const allMatched = matched.size === words.length && words.length > 0;

  function tileState(id: string, side: "left" | "right"): "idle" | "selected" | "matched" | "wrong" {
    if (matched.has(id)) return "matched";
    if (wrongIds.has(id)) return "wrong";
    if (side === "left" && selectedLeft === id) return "selected";
    if (side === "right" && selectedRight === id) return "selected";
    return "idle";
  }

  return (
    <div className="w-full">
      <MotivationToast signal={motivationSignal} />
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <ProgressBar value={matched.size} total={words.length} label={t.pairsFound} />
        </div>
        <motion.button
          type="button"
          onClick={handleShuffle}
          disabled={locked || allMatched}
          whileTap={{ scale: 0.92 }}
          whileHover={{ rotate: 15 }}
          title={t.shuffleBtn}
          className="shrink-0 flex items-center gap-1.5 h-10 px-3.5 rounded-xl border-2 border-border bg-surface text-sm font-semibold text-foreground/70 hover:border-primary hover:text-primary disabled:opacity-40 disabled:pointer-events-none transition-colors"
        >
          <span aria-hidden>🔀</span>
          <span className="hidden sm:inline">{t.shuffleBtn}</span>
        </motion.button>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-8">
        <div className="flex flex-col gap-3">
          {englishOrder.map((id) => {
            const w = wordsById.get(id);
            if (!w) return null;
            return (
              <motion.div key={id} layout transition={{ type: "spring", stiffness: 500, damping: 35 }}>
                <MatchWordTile
                  text={w.english}
                  state={tileState(w._id, "left")}
                  onClick={() => handleLeftClick(w)}
                />
              </motion.div>
            );
          })}
        </div>

        <div className="flex flex-col gap-3">
          {koreanOrder.map((id) => {
            const w = wordsById.get(id);
            if (!w) return null;
            return (
              <motion.div key={id} layout transition={{ type: "spring", stiffness: 500, damping: 35 }}>
                <MatchWordTile
                  text={w.korean}
                  state={tileState(w._id, "right")}
                  onClick={() => handleRightClick(w)}
                />
              </motion.div>
            );
          })}
        </div>
      </div>

      {allMatched && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 flex justify-center"
        >
          <Button size="lg" onClick={() => onRoundComplete(words)}>
            {t.continueBtn}
          </Button>
        </motion.div>
      )}
    </div>
  );
}
