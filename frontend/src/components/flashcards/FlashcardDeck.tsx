"use client";

import { FormEvent, useState } from "react";
import { motion } from "framer-motion";
import type { Word } from "@/lib/types";
import { WordImage } from "@/components/ui/WordImage";
import { MotivationToast } from "@/components/ui/MotivationToast";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { playAudio } from "@/lib/tts";
import { useSrsActions } from "@/hooks/useSrsSession";
import { useT } from "@/hooks/useT";

export interface FlashcardResults {
  known: string[];
  unknown: string[];
}

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, "");
}

const DRAG_THRESHOLD = 110;
// Every 3rd consecutive "Bilaman" triggers a quick typed check — catches
// overconfident presses (see FEATURE 2's "soxta bilaman" guard). Resets to
// 0 on any "Bilmayman".
const VERIFY_EVERY = 3;

export function FlashcardDeck({ words, onFinish }: { words: Word[]; onFinish: (results: FlashcardResults) => void }) {
  const t = useT("flashcards");
  const { submitReview } = useSrsActions();

  const [index, setIndex] = useState(0);
  const [flyDirection, setFlyDirection] = useState<"left" | "right" | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [correctStreak, setCorrectStreak] = useState(0);
  const [verifying, setVerifying] = useState(false);
  const [verifyInput, setVerifyInput] = useState("");
  const [verifyResult, setVerifyResult] = useState<"correct" | "wrong" | null>(null);
  const [motivationSignal, setMotivationSignal] = useState(0);
  const [known, setKnown] = useState<string[]>([]);
  const [unknown, setUnknown] = useState<string[]>([]);

  const word = words[index];
  const busy = flyDirection !== null || verifying;

  function advance(nextKnown: string[], nextUnknown: string[]) {
    setFlyDirection(null);
    setShowAnswer(false);
    if (index + 1 >= words.length) {
      onFinish({ known: nextKnown, unknown: nextUnknown });
    } else {
      setIndex((i) => i + 1);
    }
  }

  function commitKnow() {
    setFlyDirection("right");
    submitReview(word._id, "correct").catch(() => {});
    setMotivationSignal((s) => s + 1);
    const nextKnown = [...known, word._id];
    setKnown(nextKnown);
    window.setTimeout(() => advance(nextKnown, unknown), 300);
  }

  function commitDontKnow() {
    setFlyDirection("left");
    setShowAnswer(true);
    submitReview(word._id, "wrong").catch(() => {});
    const nextUnknown = [...unknown, word._id];
    setUnknown(nextUnknown);
    window.setTimeout(() => advance(known, nextUnknown), 2000);
  }

  function handleKnowPress() {
    if (busy) return;
    const nextStreak = correctStreak + 1;
    if (nextStreak % VERIFY_EVERY === 0) {
      setVerifying(true);
    } else {
      setCorrectStreak(nextStreak);
      commitKnow();
    }
  }

  function handleDontKnowPress() {
    if (busy) return;
    setCorrectStreak(0);
    commitDontKnow();
  }

  function handleVerifySubmit(e: FormEvent) {
    e.preventDefault();
    if (verifyResult) return;
    const ok = normalize(verifyInput) === normalize(word.korean);
    setVerifyResult(ok ? "correct" : "wrong");
    window.setTimeout(() => {
      setVerifying(false);
      setVerifyInput("");
      setVerifyResult(null);
      if (ok) {
        setCorrectStreak((s) => s + 1);
        commitKnow();
      } else {
        setCorrectStreak(0);
        commitDontKnow();
      }
    }, 900);
  }

  if (!word) return null;

  return (
    <div className="w-full">
      <MotivationToast signal={motivationSignal} />
      <ProgressBar value={index} total={words.length} label={t.progressLabel} />

      <div className="mt-6 flex justify-center">
        <motion.div
          key={word._id}
          drag={busy ? false : "x"}
          dragSnapToOrigin
          dragElastic={0.6}
          onDragEnd={(_e, info) => {
            if (info.offset.x > DRAG_THRESHOLD) handleKnowPress();
            else if (info.offset.x < -DRAG_THRESHOLD) handleDontKnowPress();
          }}
          whileDrag={{ scale: 1.03 }}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={
            flyDirection === "right"
              ? { x: 420, opacity: 0, rotate: 18 }
              : flyDirection === "left"
                ? { x: -420, opacity: 0, rotate: -18 }
                : { x: 0, opacity: 1, scale: 1, rotate: 0 }
          }
          transition={{ duration: 0.3 }}
          className="relative w-full max-w-xs rounded-3xl bg-surface border border-border card-shadow p-6 text-center cursor-grab active:cursor-grabbing select-none"
        >
          <button
            type="button"
            onClick={() => playAudio(word.audioUrl, word.english, "en-US")}
            aria-label="play"
            className="absolute top-3 right-3 h-8 w-8 flex items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/15"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
          </button>

          {word.imageUrl && (
            <div className="flex justify-center mb-4 mt-2">
              <WordImage
                src={word.imageUrl}
                attribution={word.imageAttribution}
                alt=""
                imgClassName="h-32 w-32 object-cover rounded-2xl"
              />
            </div>
          )}

          <p className="text-3xl font-extrabold py-4">{word.english}</p>

          {showAnswer && (
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-lg font-bold text-danger mt-1"
            >
              {word.korean}
            </motion.p>
          )}
        </motion.div>
      </div>

      {verifying ? (
        <motion.form
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleVerifySubmit}
          className="mt-6 flex flex-col items-center gap-3"
        >
          <p className="text-sm font-semibold text-primary">{t.verifyTitle}</p>
          <input
            autoFocus
            value={verifyInput}
            onChange={(e) => setVerifyInput(e.target.value)}
            disabled={Boolean(verifyResult)}
            placeholder={t.verifyPlaceholder}
            className="w-full max-w-xs text-center rounded-xl border-2 border-border bg-surface-muted px-4 py-3 text-lg font-semibold outline-none focus:ring-2 focus:ring-primary disabled:opacity-70"
          />
          {!verifyResult ? (
            <button
              type="submit"
              disabled={!verifyInput.trim()}
              className="gradient-primary text-white font-semibold px-5 py-2.5 rounded-xl disabled:opacity-50"
            >
              {t.verifyConfirm}
            </button>
          ) : (
            <p className={`font-bold ${verifyResult === "correct" ? "text-success" : "text-danger"}`}>
              {verifyResult === "correct" ? t.verifyCorrect : t.verifyWrong}
            </p>
          )}
        </motion.form>
      ) : (
        <div className="mt-8 flex justify-center gap-4">
          <button
            type="button"
            onClick={handleDontKnowPress}
            disabled={busy}
            className="min-h-14 px-6 rounded-2xl border-2 border-danger text-danger font-bold text-base hover:bg-danger-soft transition-colors disabled:opacity-50"
          >
            {t.dontKnowBtn}
          </button>
          <button
            type="button"
            onClick={handleKnowPress}
            disabled={busy}
            className="min-h-14 px-6 rounded-2xl border-2 border-success text-success font-bold text-base hover:bg-success-soft transition-colors disabled:opacity-50"
          >
            {t.knowBtn}
          </button>
        </div>
      )}

      <p className="mt-5 text-center text-xs text-foreground/40">{t.swipeHint}</p>
    </div>
  );
}
