"use client";

import { FormEvent, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Word } from "@/lib/types";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Card } from "@/components/ui/Card";
import { MotivationToast } from "@/components/ui/MotivationToast";
import { MatchWordTile } from "@/components/match/MatchWordTile";
import { useSrsActions } from "@/hooks/useSrsSession";
import { useT } from "@/hooks/useT";

interface RecallResult {
  wordId: string;
  correct: boolean;
  helped?: boolean;
}

type HelpStage = "idle" | "choices" | "write";

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, "");
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function RecallQuiz({ words, onFinish }: { words: Word[]; onFinish: (results: RecallResult[]) => void }) {
  const t = useT("recall");
  const { submitReview, fetchDistractors } = useSrsActions();

  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<{ correct: boolean; correctAnswer: string; helped?: boolean } | null>(
    null,
  );
  const [results, setResults] = useState<RecallResult[]>([]);
  const [checking, setChecking] = useState(false);
  const [motivationSignal, setMotivationSignal] = useState(0);

  // Feature 1: "Yordam" hint flow.
  const [stage, setStage] = useState<HelpStage>("idle");
  const [helpLoading, setHelpLoading] = useState(false);
  const [choices, setChoices] = useState<Word[]>([]);
  const [selectedCorrect, setSelectedCorrect] = useState(false);
  const [wrongChoiceId, setWrongChoiceId] = useState<string | null>(null);
  const [writeError, setWriteError] = useState(false);

  const word = words[index];

  function goToNext(nextResults: RecallResult[]) {
    setFeedback(null);
    setInput("");
    setStage("idle");
    setChoices([]);
    setSelectedCorrect(false);
    setWrongChoiceId(null);
    setWriteError(false);
    if (index + 1 < words.length) {
      setIndex(index + 1);
    } else {
      onFinish(nextResults);
    }
  }

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
      if (res.correct) setMotivationSignal((s) => s + 1);
      const nextResults = [...results, { wordId: word._id, correct: res.correct }];
      setResults(nextResults);
      window.setTimeout(() => goToNext(nextResults), 1200);
    } finally {
      setChecking(false);
    }
  }

  async function handleHelp() {
    if (!word || helpLoading || checking || stage !== "idle" || feedback) return;
    setHelpLoading(true);
    try {
      const res = await fetchDistractors(word._id, 4);
      setChoices(shuffle([word, ...res.distractors]));
      setStage("choices");
    } catch {
      // Leave the button clickable so the learner can retry.
    } finally {
      setHelpLoading(false);
    }
  }

  function handleChoiceClick(choice: Word) {
    if (selectedCorrect || !word) return;
    if (choice._id === word._id) {
      setSelectedCorrect(true);
      window.setTimeout(() => {
        setStage("write");
        setSelectedCorrect(false);
        setWrongChoiceId(null);
      }, 700);
    } else {
      setWrongChoiceId(choice._id);
      window.setTimeout(() => {
        setWrongChoiceId((id) => (id === choice._id ? null : id));
      }, 500);
    }
  }

  function handleWriteSubmit(e: FormEvent) {
    e.preventDefault();
    if (!word || feedback) return;
    if (normalize(input) !== normalize(word.english)) {
      setWriteError(true);
      window.setTimeout(() => setWriteError(false), 500);
      return;
    }
    submitReview(word._id, "helped").catch(() => {});
    const helpedFeedback = { correct: false, correctAnswer: word.english, helped: true };
    setFeedback(helpedFeedback);
    const nextResults = [...results, { wordId: word._id, correct: false, helped: true }];
    setResults(nextResults);
    window.setTimeout(() => goToNext(nextResults), 1200);
  }

  if (!word) return null;

  const inputDisabled = stage === "choices" || Boolean(feedback) || checking;

  return (
    <div className="w-full">
      <MotivationToast signal={motivationSignal} />
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

            <form
              onSubmit={stage === "write" ? handleWriteSubmit : handleSubmit}
              className="flex flex-col items-center gap-4"
            >
              <AnimatePresence>
                {stage === "write" && (
                  <motion.p
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-sm font-semibold text-primary"
                  >
                    {t.writeInstruction}
                  </motion.p>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {stage === "write" && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-lg font-semibold text-foreground/25 select-none -mb-1"
                  >
                    {word.english}
                  </motion.p>
                )}
              </AnimatePresence>

              <motion.input
                autoFocus
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={inputDisabled}
                animate={writeError ? { x: [0, -6, 6, -4, 4, 0] } : {}}
                transition={{ duration: 0.35 }}
                placeholder={stage === "write" ? word.english : t.placeholder}
                className={`w-full max-w-xs text-center rounded-xl border-2 bg-surface-muted px-4 py-3 text-lg font-semibold outline-none focus:ring-2 focus:ring-primary disabled:opacity-70 transition-colors ${
                  writeError ? "border-danger" : "border-border"
                } ${
                  stage === "write"
                    ? "placeholder:font-semibold placeholder:text-foreground/25"
                    : "placeholder:font-normal placeholder:text-foreground/40"
                }`}
              />

              {stage === "idle" && !feedback && (
                <div className="flex flex-col items-center gap-2">
                  <Button type="submit" disabled={checking || !input.trim()}>
                    {t.check}
                  </Button>
                  <button
                    type="button"
                    onClick={handleHelp}
                    disabled={helpLoading || checking}
                    className="text-sm font-medium text-foreground/40 hover:text-primary transition-colors disabled:opacity-50"
                  >
                    {helpLoading ? "…" : t.helpBtn}
                  </button>
                </div>
              )}

              {stage === "write" && !feedback && (
                <Button type="submit" disabled={!input.trim()}>
                  {t.confirm}
                </Button>
              )}
            </form>

            <AnimatePresence>
              {stage === "choices" && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3"
                >
                  {choices.map((choice) => {
                    const state =
                      selectedCorrect && choice._id === word._id
                        ? "matched"
                        : wrongChoiceId === choice._id
                          ? "wrong"
                          : "idle";
                    return (
                      <MatchWordTile
                        key={choice._id}
                        text={choice.english}
                        state={state}
                        disabled={selectedCorrect}
                        onClick={() => handleChoiceClick(choice)}
                      />
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {feedback && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`mt-5 font-bold text-lg ${
                    feedback.helped ? "text-primary" : feedback.correct ? "text-success" : "text-danger"
                  }`}
                >
                  {feedback.helped
                    ? t.helpedFeedback
                    : feedback.correct
                      ? t.correct
                      : `${t.correctAnswer} ${feedback.correctAnswer}`}
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
