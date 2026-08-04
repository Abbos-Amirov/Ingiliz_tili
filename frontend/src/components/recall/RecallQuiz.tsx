"use client";

import { FormEvent, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Word } from "@/lib/types";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Card } from "@/components/ui/Card";
import { useT } from "@/hooks/useT";

interface RecallResult {
  wordId: string;
  correct: boolean;
}

export function RecallQuiz({ words, onFinish }: { words: Word[]; onFinish: (results: RecallResult[]) => void }) {
  const t = useT("recall");
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<{ correct: boolean; correctAnswer: string } | null>(null);
  const [results, setResults] = useState<RecallResult[]>([]);
  const [checking, setChecking] = useState(false);

  const word = words[index];

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!word || checking || feedback) return;
    setChecking(true);
    try {
      const res = await apiFetch<{ correct: boolean; correctAnswer: string }>("/srs/recall-check", {
        method: "POST",
        body: JSON.stringify({ wordId: word._id, userAnswer: input }),
      });
      setFeedback(res);
      const nextResults = [...results, { wordId: word._id, correct: res.correct }];
      setResults(nextResults);
      window.setTimeout(() => {
        setFeedback(null);
        setInput("");
        if (index + 1 < words.length) {
          setIndex(index + 1);
        } else {
          onFinish(nextResults);
        }
      }, 1200);
    } finally {
      setChecking(false);
    }
  }

  if (!word) return null;

  return (
    <div className="w-full">
      <ProgressBar value={index} total={words.length} label={t.title} />

      <AnimatePresence mode="wait">
        <motion.div
          key={word._id}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.25 }}
        >
          <Card className="mt-6 p-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground/50 mb-3">{t.label}</p>
            <p className="text-3xl font-extrabold gradient-text mb-6">{word.korean}</p>

            <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4">
              <input
                autoFocus
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={Boolean(feedback)}
                className="w-full max-w-xs text-center rounded-xl border-2 border-border bg-surface-muted px-4 py-3 text-lg font-semibold outline-none focus:ring-2 focus:ring-primary disabled:opacity-70"
                placeholder={t.placeholder}
              />
              {!feedback && (
                <Button type="submit" disabled={checking || !input.trim()}>
                  {t.check}
                </Button>
              )}
            </form>

            <AnimatePresence>
              {feedback && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`mt-5 font-bold text-lg ${feedback.correct ? "text-success" : "text-danger"}`}
                >
                  {feedback.correct ? t.correct : `${t.correctAnswer} ${feedback.correctAnswer}`}
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
