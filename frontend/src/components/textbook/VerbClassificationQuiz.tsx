"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { apiFetch } from "@/lib/api";
import { useT } from "@/hooks/useT";
import type { VerbQuizItem, VerbType } from "@/lib/textbook";
import { Button } from "@/components/ui/Button";
import { Asterisk } from "@/components/ui/Shapes";
import { VERB_TYPE_STYLE } from "./VerbOverview";

const OPTIONS: VerbType[] = ["be_verb", "general_verb", "modal_verb"];

function shuffled<T>(items: T[], seed: number): T[] {
  const a = [...items];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Be동사 / 일반동사 / 조동사 ajratish testi. Each pick is checked (and a wrong
// one logged as a mistake) server-side; the card advances after 1 second.
// `lessonPath` is the lesson's API path, e.g. /textbook/books/0/lessons/1.
export function VerbClassificationQuiz({ lessonPath, quiz }: { lessonPath: string; quiz: VerbQuizItem[] }) {
  const t = useT("textbook");
  const [round, setRound] = useState(1);
  const items = useMemo(() => shuffled(quiz, round * 7919 + quiz.length), [quiz, round]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<{ correct: boolean; correctType: VerbType } | null>(null);

  const item = items[current];

  async function answer(selected: VerbType) {
    if (!item || feedback) return;
    let correctType = item.correctType;
    let correct = selected === item.correctType;
    try {
      const res = await apiFetch<{ isCorrect: boolean; correctType: VerbType }>(
        `${lessonPath}/verb-quiz`,
        { method: "POST", body: JSON.stringify({ itemKey: item.key, selectedType: selected }) },
      );
      correct = res.isCorrect;
      correctType = res.correctType;
    } catch {
      // offline: fall back to the local answer key
    }
    if (correct) setScore((s) => s + 1);
    setFeedback({ correct, correctType });
    setTimeout(() => {
      setFeedback(null);
      setCurrent((c) => c + 1);
    }, 1000);
  }

  if (quiz.length === 0) return null;

  return (
    <div className="relative overflow-hidden rounded-3xl ink-panel p-5 sm:p-6">
      <Asterisk size={90} color="rgba(255,255,255,0.05)" className="absolute -right-4 -top-4" />
      <div className="relative flex items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="font-bold text-lg text-on-ink">{t.quizTitle}</h3>
          <p className="text-sm text-on-ink/60">{t.quizSubtitle}</p>
        </div>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-gold">
          {Math.min(current + 1, items.length)}/{items.length}
        </span>
      </div>

      {item ? (
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={item.key + round}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-2xl bg-white/[0.06] border border-white/10 p-5 text-center"
            >
              <p className="font-serif text-4xl font-bold text-gold">{item.word}</p>
              <p className="mt-2 text-on-ink/75">{item.exampleSentence}</p>
            </motion.div>
          </AnimatePresence>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {OPTIONS.map((opt) => {
              const isAnswer = feedback && feedback.correctType === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => answer(opt)}
                  disabled={!!feedback}
                  className={`min-h-12 rounded-xl px-2 py-2.5 text-sm font-bold transition-all border ${
                    isAnswer
                      ? "bg-success text-white border-success"
                      : "bg-white text-[#1b1035] border-transparent hover:brightness-95 disabled:opacity-60"
                  }`}
                >
                  <span className={`inline-block h-2 w-2 rounded-full mr-1.5 align-middle ${VERB_TYPE_STYLE[opt].dot}`} />
                  {t.verbTypes[opt]}
                </button>
              );
            })}
          </div>

          <div className="h-7 mt-3 text-center">
            {feedback && (
              <p className={`font-bold ${feedback.correct ? "text-success" : "text-[#ff8a80]"}`}>
                {feedback.correct ? `✅ ${t.quizCorrect}` : `❌ ${t.quizWrongPrefix} ${t.verbTypes[feedback.correctType]}`}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="relative text-center py-4">
          <p className="font-serif text-2xl font-bold text-on-ink">🎉 {t.quizDone}</p>
          <p className="mt-1 text-on-ink/70">
            {t.quizScore}: <span className="font-bold text-gold">{score}/{items.length}</span>
          </p>
          <Button
            variant="gold"
            className="mt-4"
            onClick={() => {
              setRound((r) => r + 1);
              setCurrent(0);
              setScore(0);
            }}
          >
            {t.quizRestart}
          </Button>
        </div>
      )}
    </div>
  );
}
