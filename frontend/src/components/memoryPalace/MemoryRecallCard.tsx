"use client";

import { FormEvent, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { MemoryAnchor, Word } from "@/lib/types";
import { apiFetch } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MatchWordTile } from "@/components/match/MatchWordTile";
import { useSrsActions } from "@/hooks/useSrsSession";
import { useMemoryPalace } from "@/hooks/useMemoryPalace";
import { useT } from "@/hooks/useT";
import { playAudio, speak } from "@/lib/tts";

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

// Shared "show the anchor, guess the word" card — used both by the general
// SRS-driven /memory-palace/recall session and by a journey's ordered
// walk-through. Reuses the same generic /srs/recall-check endpoint the
// Active Recall mode uses (it just checks free text against a word's
// English spelling), but records the result against this MemoryAnchor's own
// SRS state (recallSrsInterval etc.) rather than the word's UserWordProgress
// — the two tracks are intentionally independent.
export function MemoryRecallCard({ anchor, onResult }: { anchor: MemoryAnchor; onResult: (correct: boolean) => void }) {
  const t = useT("memoryPalace");
  const { fetchDistractors } = useSrsActions();
  const { submitRecallResult } = useMemoryPalace();

  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<{ correct: boolean; correctAnswer: string; helped?: boolean } | null>(
    null,
  );
  const [checking, setChecking] = useState(false);

  const [stage, setStage] = useState<HelpStage>("idle");
  const [helpLoading, setHelpLoading] = useState(false);
  const [choices, setChoices] = useState<Word[]>([]);
  const [selectedCorrect, setSelectedCorrect] = useState(false);
  const [wrongChoiceId, setWrongChoiceId] = useState<string | null>(null);
  const [writeError, setWriteError] = useState(false);

  const word = anchor.wordId;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (checking || feedback) return;
    setChecking(true);
    try {
      const res = await apiFetch<{ correct: boolean; correctAnswer: string }>("/srs/recall-check", {
        method: "POST",
        body: JSON.stringify({ wordId: word._id, userAnswer: input }),
      });
      setFeedback(res);
      submitRecallResult(anchor._id, res.correct ? "correct" : "wrong").catch(() => {});
      window.setTimeout(() => onResult(res.correct), 1300);
    } finally {
      setChecking(false);
    }
  }

  async function handleHelp() {
    if (helpLoading || checking || stage !== "idle" || feedback) return;
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
    if (selectedCorrect) return;
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
    if (feedback) return;
    if (normalize(input) !== normalize(word.english)) {
      setWriteError(true);
      window.setTimeout(() => setWriteError(false), 500);
      return;
    }
    // A hint-assisted recall isn't independent retrieval, so it's scored
    // the same as a wrong answer for the anchor's own SRS state.
    const helpedFeedback = { correct: false, correctAnswer: word.english, helped: true };
    setFeedback(helpedFeedback);
    submitRecallResult(anchor._id, "wrong").catch(() => {});
    window.setTimeout(() => onResult(false), 1300);
  }

  const inputDisabled = stage === "choices" || Boolean(feedback) || checking;

  return (
    <Card className="p-6 sm:p-8 text-center">
      {anchor.imageUrl ? (
        <div className="mb-5 flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={anchor.imageUrl}
            alt=""
            className="h-48 w-48 sm:h-56 sm:w-56 object-cover rounded-2xl border border-border"
          />
        </div>
      ) : (
        <div className="mb-5 rounded-2xl bg-surface-muted border border-border/60 px-5 py-8">
          <p className="text-lg font-medium italic text-foreground/70">&ldquo;{anchor.textDescription}&rdquo;</p>
        </div>
      )}

      <p className="text-sm font-semibold text-primary mb-5">{t.recallQuestion}</p>

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

        <div className="relative w-full max-w-xs">
          {input.trim() && (
            <button
              type="button"
              onClick={() =>
                normalize(input) === normalize(word.english)
                  ? playAudio(word.audioUrl, word.english, "en-US")
                  : speak(input.trim(), "en-US")
              }
              aria-label={t.listenBtn}
              title={t.listenBtn}
              className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10 h-8 w-8 flex items-center justify-center rounded-full bg-success text-white shadow-md shadow-success/30 hover:brightness-105 transition-all"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              </svg>
            </button>
          )}
          <motion.input
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={inputDisabled}
            animate={writeError ? { x: [0, -6, 6, -4, 4, 0] } : {}}
            transition={{ duration: 0.35 }}
            placeholder={stage === "write" ? word.english : t.recallPlaceholder}
            className={`w-full text-center rounded-xl border-2 bg-surface-muted px-4 py-3 text-lg font-semibold outline-none focus:ring-2 focus:ring-primary disabled:opacity-70 transition-colors ${
              writeError ? "border-danger" : "border-border"
            } ${
              stage === "write"
                ? "placeholder:font-semibold placeholder:text-foreground/25"
                : "placeholder:font-normal placeholder:text-foreground/40"
            }`}
          />
        </div>

        {stage === "idle" && !feedback && (
          <div className="flex flex-col items-center gap-2">
            <Button type="submit" disabled={checking || !input.trim()}>
              {t.checkBtn}
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
            {t.confirmBtn}
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
                ? t.correctFeedback
                : `${t.wrongFeedbackPrefix} ${feedback.correctAnswer}`}
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
