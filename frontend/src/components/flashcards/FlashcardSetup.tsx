"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { Lesson, Word } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useT } from "@/hooks/useT";
import { formatLessonRange } from "@/lib/lessonRange";

const CARD_COUNTS = [10, 20, 50];

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function lessonKey(l: Lesson): string {
  return `${l.lessonNumber}-${l.lessonNumberEnd}`;
}

export function FlashcardSetup({
  initialSource,
  onStart,
}: {
  initialSource?: "lessons" | "difficult";
  onStart: (words: Word[]) => void;
}) {
  const t = useT("flashcards");
  const tLessons = useT("lessons");

  const [lessons, setLessons] = useState<Lesson[] | null>(null);
  const [source, setSource] = useState<"lessons" | "difficult">(initialSource ?? "lessons");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [cardCount, setCardCount] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [difficultCount, setDifficultCount] = useState<number | null>(null);

  useEffect(() => {
    apiFetch<{ lessons: Lesson[] }>("/lessons").then((res) => setLessons(res.lessons));
    apiFetch<{ words: Word[] }>("/srs/difficult-words")
      .then((res) => setDifficultCount(res.words.length))
      .catch(() => setDifficultCount(0));
  }, []);

  function toggleLesson(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    setError(null);
  }

  async function handleStart() {
    setError(null);
    if (source === "lessons" && selected.size === 0) {
      setError(t.selectAtLeastOne);
      return;
    }
    setLoading(true);
    try {
      let pool: Word[] = [];
      if (source === "difficult") {
        const res = await apiFetch<{ words: Word[] }>("/srs/difficult-words");
        pool = res.words;
      } else {
        const numbers: number[] = [];
        for (const key of selected) {
          const lesson = lessons?.find((l) => lessonKey(l) === key);
          if (!lesson) continue;
          for (let n = lesson.lessonNumber; n <= lesson.lessonNumberEnd; n++) numbers.push(n);
        }
        const res = await apiFetch<{ words: Word[] }>(`/words?lessons=${numbers.join(",")}&limit=500`);
        pool = res.words;
      }
      if (pool.length === 0) {
        setError(t.noWordsFound);
        return;
      }
      onStart(shuffle(pool).slice(0, cardCount));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-6 sm:p-8">
      <h2 className="font-bold text-lg mb-4 text-center">{t.setupTitle}</h2>

      <div className="flex justify-center gap-2 mb-6 flex-wrap">
        <button
          type="button"
          onClick={() => setSource("lessons")}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
            source === "lessons" ? "gradient-primary text-white" : "bg-surface-muted text-foreground/70"
          }`}
        >
          {t.sourceLessons}
        </button>
        <button
          type="button"
          onClick={() => setSource("difficult")}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
            source === "difficult" ? "gradient-primary text-white" : "bg-surface-muted text-foreground/70"
          }`}
        >
          {t.sourceDifficult}
          {difficultCount !== null && ` (${difficultCount})`}
        </button>
      </div>

      {source === "lessons" ? (
        !lessons ? (
          <div className="flex justify-center py-10">
            <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
        ) : (
          <>
            <p className="text-xs text-foreground/50 text-center mb-3">{t.selectLessonsHint}</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-64 overflow-y-auto">
              {lessons.map((l) => {
                const key = lessonKey(l);
                const active = selected.has(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleLesson(key)}
                    className={`px-3 py-2.5 rounded-xl border-2 text-sm font-semibold transition-colors ${
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-surface text-foreground/70 hover:border-primary/40"
                    }`}
                  >
                    {formatLessonRange(l.lessonNumber, l.lessonNumberEnd)}
                    {tLessons.lessonSuffix}
                  </button>
                );
              })}
            </div>
          </>
        )
      ) : (
        difficultCount === 0 && <p className="text-center text-sm text-foreground/50 py-6">{t.noDifficultWords}</p>
      )}

      <div className="mt-6">
        <p className="text-xs text-foreground/50 text-center mb-2">{t.cardCountLabel}</p>
        <div className="flex justify-center gap-2">
          {CARD_COUNTS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setCardCount(n)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                cardCount === n ? "gradient-primary text-white" : "bg-surface-muted text-foreground/70"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-danger text-sm text-center mt-4">{error}</p>}

      <div className="mt-8 flex justify-center">
        <Button size="lg" onClick={handleStart} disabled={loading || (source === "difficult" && difficultCount === 0)}>
          {loading ? "..." : t.startBtn}
        </Button>
      </div>
    </Card>
  );
}
