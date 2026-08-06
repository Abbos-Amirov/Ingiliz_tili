"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiFetch } from "@/lib/api";
import type { Sentence } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useGrammarTopics } from "@/hooks/useGrammarTopics";
import { useT } from "@/hooks/useT";

interface Question {
  korean: string;
  correct: string;
  options: string[];
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildQuestions(pool: Sentence[], count: number): Question[] {
  const allTexts = pool.map((s) => s.words.map((w) => w.text).join(" "));
  const chosen = shuffle(pool).slice(0, Math.min(count, pool.length));
  return chosen.map((s) => {
    const correct = s.words.map((w) => w.text).join(" ");
    const distractors = shuffle(allTexts.filter((text) => text !== correct)).slice(0, 3);
    return { korean: s.korean, correct, options: shuffle([correct, ...distractors]) };
  });
}

export function GrammarQuiz({ topicId, formula }: { topicId: string; formula: string }) {
  const t = useT("grammar");
  const { submitQuizResult } = useGrammarTopics();

  const [pool, setPool] = useState<Sentence[] | null>(null);
  const [started, setStarted] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    apiFetch<{ sentences: Sentence[] }>(`/sentences?formula=${encodeURIComponent(formula)}&limit=30`)
      .then((res) => setPool(res.sentences))
      .catch(() => setPool([]));
  }, [formula]);

  function start() {
    if (!pool || pool.length < 2) return;
    setQuestions(buildQuestions(pool, 5));
    setIndex(0);
    setSelected(null);
    setCorrectCount(0);
    setDone(false);
    setStarted(true);
  }

  function handleAnswer(option: string) {
    if (selected) return;
    setSelected(option);
    const q = questions[index];
    const isCorrect = option === q.correct;
    const finalCorrect = isCorrect ? correctCount + 1 : correctCount;
    if (isCorrect) setCorrectCount(finalCorrect);

    window.setTimeout(() => {
      if (index + 1 < questions.length) {
        setIndex((i) => i + 1);
        setSelected(null);
      } else {
        setDone(true);
        submitQuizResult(topicId, finalCorrect, questions.length).catch(() => {});
      }
    }, 900);
  }

  if (!started) {
    return (
      <Card className="p-6 text-center">
        <h3 className="font-bold text-lg mb-3">{t.quizTitle}</h3>
        {pool === null ? (
          <div className="flex justify-center py-4">
            <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
        ) : pool.length < 2 ? (
          <p className="text-foreground/60 text-sm">{t.quizEmpty}</p>
        ) : (
          <Button onClick={start}>{t.quizStart}</Button>
        )}
      </Card>
    );
  }

  if (done) {
    return (
      <Card className="p-6 text-center">
        <p className="text-4xl font-extrabold gradient-text mb-2">
          {correctCount}/{questions.length}
        </p>
        <p className="text-foreground/60 mb-5">{t.quizResultSuffix}</p>
        <Button onClick={start}>{t.quizRetry}</Button>
      </Card>
    );
  }

  const q = questions[index];

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg">{t.quizTitle}</h3>
        <span className="text-sm text-foreground/50">
          {index + 1}/{questions.length} {t.quizQuestionOf}
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.2 }}
        >
          <p className="text-center text-lg font-semibold mb-5">{q.korean}</p>
          <div className="grid grid-cols-1 gap-2.5">
            {q.options.map((opt) => {
              const isCorrectOpt = opt === q.correct;
              const isSelected = opt === selected;
              const showState = Boolean(selected);
              const stateClass = !showState
                ? "border-border bg-surface-muted hover:border-primary/40"
                : isCorrectOpt
                  ? "border-success bg-success-soft text-success"
                  : isSelected
                    ? "border-danger bg-danger-soft text-danger"
                    : "border-border bg-surface-muted opacity-60";
              return (
                <button
                  key={opt}
                  type="button"
                  disabled={showState}
                  onClick={() => handleAnswer(opt)}
                  className={`text-left px-4 py-2.5 rounded-xl border-2 font-medium text-sm transition-colors ${stateClass}`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>
    </Card>
  );
}
