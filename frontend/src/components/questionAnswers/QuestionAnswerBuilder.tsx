"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Sentence, GrammarRole } from "@/lib/types";
import { WordChip } from "@/components/sentence/WordChip";
import { FormulaBar } from "@/components/sentence/FormulaBar";
import { DeepExplanationModal } from "@/components/sentence/DeepExplanationModal";
import { Button } from "@/components/ui/Button";
import { MotivationToast } from "@/components/ui/MotivationToast";
import { playAudio } from "@/lib/tts";
import { useT, useLocale } from "@/hooks/useT";
import { ROLE_COLORS } from "@/lib/roleColors";
import { getWhWordMeaning } from "@/lib/whWordMeanings";

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

interface PoolItem {
  key: string;
  text: string;
  role: GrammarRole;
  audioUrl?: string | null;
}

function ReplaySpeakerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}

/** The Savol-Javob (Q&A) bidirectional practice card — structurally a
 * cousin of SentenceBuilder, but the "prompt" shown fixed at top is another
 * sentence entirely (the question in mode A, the answer in mode B) rather
 * than this sentence's own Korean translation. */
export function QuestionAnswerBuilder({
  promptSentence,
  targetSentence,
  mode,
  onComplete,
}: {
  promptSentence: Sentence;
  targetSentence: Sentence;
  mode: "A" | "B";
  onComplete: () => void;
}) {
  const t = useT("sentence");
  const tqa = useT("questionAnswers");
  const td = useT("deepExplanation");
  const { locale } = useLocale();

  const pool = useMemo(() => {
    const all = [...targetSentence.words, ...targetSentence.distractorWords];
    return shuffle(all.map((rw, i) => ({ key: `${rw.text}-${i}`, text: rw.text, role: rw.role, audioUrl: rw.audioUrl })));
  }, [targetSentence]);

  const [remaining, setRemaining] = useState<PoolItem[]>(pool);
  const [placed, setPlaced] = useState<PoolItem[]>([]);
  const [wrongKey, setWrongKey] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pulseKey, setPulseKey] = useState(0);
  const [motivationSignal, setMotivationSignal] = useState(0);
  const [explanationOpen, setExplanationOpen] = useState(false);

  function handlePick(item: PoolItem) {
    if (wrongKey || done) return;
    playAudio(item.audioUrl, item.text, "en-US");
    const expected = targetSentence.words[placed.length];
    if (item.text === expected.text) {
      const nextPlaced = [...placed, item];
      setPlaced(nextPlaced);
      setRemaining((prev) => prev.filter((p) => p.key !== item.key));
      setHint(null);
      setPulseKey((k) => k + 1);
      if (nextPlaced.length === targetSentence.words.length) {
        setDone(true);
        setMotivationSignal((s) => s + 1);
        playAudio(targetSentence.audioUrl, targetSentence.words.map((w) => w.text).join(" "), "en-US");
      }
    } else {
      setWrongKey(item.key);
      setHint(t.wrongHint);
      window.setTimeout(() => setWrongKey(null), 400);
    }
  }

  function handleUndo(item: PoolItem, index: number) {
    if (done) return;
    setPlaced((prev) => prev.slice(0, index));
    setRemaining((prev) => [...prev, ...placed.slice(index)]);
    setHint(null);
  }

  const promptIsQuestion = mode === "A";
  const category = promptSentence.questionCategory;
  const firstPromptWord = promptSentence.words[0]?.text;
  const whMeaning = category === "wh_question" && firstPromptWord ? getWhWordMeaning(firstPromptWord) : null;
  const badgeColor = category === "wh_question" ? ROLE_COLORS.question_word : ROLE_COLORS.auxiliary;

  return (
    <div className="w-full">
      <MotivationToast signal={motivationSignal} />

      <div className="rounded-2xl bg-surface-muted border border-border p-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-foreground/50 mb-2">
          {promptIsQuestion ? tqa.questionLabel : tqa.answerLabel}
        </p>
        <p className="text-xl sm:text-2xl font-bold">{promptSentence.words.map((w) => w.text).join(" ")}</p>
        <p className="text-sm text-foreground/60 mt-1">{promptSentence.korean}</p>

        {promptIsQuestion && category && (
          <div className="mt-3 flex justify-center">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
              style={{ backgroundColor: badgeColor.bg, color: badgeColor.text }}
            >
              {category === "yes_no"
                ? tqa.yesNoBadge
                : whMeaning
                  ? `❓ ${firstPromptWord?.toUpperCase()} — ${whMeaning[locale]}`
                  : tqa.whBadge}
            </span>
          </div>
        )}

        <button
          type="button"
          onClick={() => playAudio(promptSentence.audioUrl, promptSentence.words.map((w) => w.text).join(" "), "en-US")}
          aria-label={t.replayAudio}
          title={t.replayAudio}
          className="mt-3 inline-flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary hover:bg-primary/15"
        >
          <ReplaySpeakerIcon />
        </button>
      </div>

      {targetSentence.formula && (
        <div className="mt-4">
          <FormulaBar formula={targetSentence.formula} pulseKey={pulseKey} />
        </div>
      )}

      <p className="mt-4 text-center text-sm font-semibold text-primary">{mode === "A" ? tqa.modeABadge : tqa.modeBBadge}</p>

      <div className={`relative mt-4 ${done && targetSentence.deepExplanation ? "mb-14" : ""}`}>
        {done && (
          <button
            type="button"
            onClick={() => playAudio(targetSentence.audioUrl, targetSentence.words.map((w) => w.text).join(" "), "en-US")}
            aria-label={t.replayAudio}
            title={t.replayAudio}
            className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10 h-8 w-8 flex items-center justify-center rounded-full bg-success text-white shadow-md shadow-success/30 hover:brightness-105 transition-all"
          >
            <ReplaySpeakerIcon />
          </button>
        )}
        <div className="min-h-16 rounded-2xl border-2 border-dashed border-border p-4 flex flex-wrap gap-3 items-start justify-center">
          <AnimatePresence>
            {placed.length === 0 && <span className="text-foreground/40 text-sm mt-2.5">{t.placeholder}</span>}
            {placed.map((item, i) => (
              <WordChip
                key={item.key}
                text={item.text}
                role={item.role}
                variant="placed"
                showLabel
                onClick={() => handleUndo(item, i)}
              />
            ))}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {done && targetSentence.deepExplanation && (
            <motion.button
              type="button"
              onClick={() => setExplanationOpen(true)}
              initial={{ opacity: 0, y: -10, scale: 0.9 }}
              animate={{ opacity: 1, y: [0, -5, 0], scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.9 }}
              transition={{
                opacity: { duration: 0.3, delay: 0.2 },
                scale: { duration: 0.3, delay: 0.2 },
                y: { duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 0.8 },
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="absolute left-1/2 -translate-x-1/2 -bottom-6 z-10 w-[92%] sm:w-auto sm:max-w-sm gradient-primary text-white rounded-2xl px-4 py-2.5 shadow-lg shadow-indigo-500/30 text-xs font-semibold text-center leading-snug hover:brightness-105 transition-[filter]"
            >
              {td.triggerBtn}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {hint && (
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-3 text-center text-sm text-danger font-medium"
          >
            {hint}
          </motion.p>
        )}
      </AnimatePresence>

      <div className="mt-6 flex flex-wrap gap-3 justify-center">
        <AnimatePresence>
          {remaining.map((item) => (
            <motion.div
              key={item.key}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <WordChip
                text={item.text}
                role={item.role}
                variant={item.key === wrongKey ? "wrong" : "pool"}
                showLabel
                onClick={() => handlePick(item)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {done && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 flex flex-col items-center gap-3"
        >
          <p className="text-success font-bold text-lg">{tqa.correct}</p>
          <Button onClick={onComplete}>{tqa.nextPairBtn}</Button>
        </motion.div>
      )}

      <DeepExplanationModal sentence={targetSentence} open={explanationOpen} onClose={() => setExplanationOpen(false)} />
    </div>
  );
}
