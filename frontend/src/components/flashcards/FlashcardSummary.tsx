"use client";

import { useEffect, useState } from "react";
import type { Word, UserStats } from "@/lib/types";
import type { FlashcardResults } from "./FlashcardDeck";
import { apiFetch } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useT } from "@/hooks/useT";

export function FlashcardSummary({
  words,
  results,
  onRestart,
  onReviewDifficult,
  onExit,
}: {
  words: Word[];
  results: FlashcardResults;
  onRestart: () => void;
  onReviewDifficult: () => void;
  onExit: () => void;
}) {
  const t = useT("flashcards");
  const [stats, setStats] = useState<UserStats | null>(null);

  useEffect(() => {
    apiFetch<{ stats: UserStats }>("/stats/me")
      .then((res) => setStats(res.stats))
      .catch(() => {});
  }, []);

  const wordsById = new Map(words.map((w) => [w._id, w]));
  const hardestWords = results.unknown.map((id) => wordsById.get(id)).filter((w): w is Word => Boolean(w));

  return (
    <Card className="p-6 sm:p-8 text-center">
      <h2 className="font-bold text-xl mb-6">{t.summaryTitle}</h2>

      <div className="flex justify-center gap-10 mb-6">
        <div>
          <p className="text-3xl font-extrabold text-success">{results.known.length}</p>
          <p className="text-xs text-foreground/50 mt-1">{t.knownCount}</p>
        </div>
        <div>
          <p className="text-3xl font-extrabold text-danger">{results.unknown.length}</p>
          <p className="text-xs text-foreground/50 mt-1">{t.unknownCount}</p>
        </div>
      </div>

      {hardestWords.length > 0 && (
        <div className="mb-6 text-left">
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground/50 mb-2 text-center">
            {t.hardestWordsTitle}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {hardestWords.map((w) => (
              <span key={w._id} className="px-3 py-1 rounded-full bg-danger-soft text-danger text-sm font-medium">
                {w.english} — {w.korean}
              </span>
            ))}
          </div>
        </div>
      )}

      {stats && (
        <div className="mb-6 max-w-xs mx-auto">
          {stats.wordsLearnedToday >= stats.dailyGoal ? (
            <p className="text-success font-semibold text-sm">{t.dailyGoalReached}</p>
          ) : (
            <>
              <p className="text-sm text-foreground/60 mb-2">
                {t.dailyGoalRemaining} {stats.dailyGoal - stats.wordsLearnedToday} {t.dailyGoalWordsLeft}
              </p>
              <ProgressBar value={stats.wordsLearnedToday} total={stats.dailyGoal} />
            </>
          )}
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-3">
        <Button onClick={onRestart}>{t.restartBtn}</Button>
        {hardestWords.length > 0 && (
          <Button variant="secondary" onClick={onReviewDifficult}>
            {t.reviewDifficultBtn}
          </Button>
        )}
        <Button variant="ghost" onClick={onExit}>
          {t.exitBtn}
        </Button>
      </div>
    </Card>
  );
}
