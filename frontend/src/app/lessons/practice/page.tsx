"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useT } from "@/hooks/useT";
import { apiFetch } from "@/lib/api";
import type { Word, Sentence } from "@/lib/types";
import { MatchBoard } from "@/components/match/MatchBoard";
import { SentenceBuilder } from "@/components/sentence/SentenceBuilder";
import { WordSentenceBuilder } from "@/components/lessons/WordSentenceBuilder";
import { RecallQuiz } from "@/components/recall/RecallQuiz";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAiChatContextStore } from "@/store/aiChatContext";

const CHUNK_SIZE = 8;

function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function PracticeContent() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useT("lessons");
  const tMatch = useT("match");
  const tSentence = useT("sentence");

  const isAll = searchParams.get("all") === "true";
  const lessonsParam = searchParams.get("lessons") ?? "";
  const modeParam = searchParams.get("mode");
  const mode = modeParam === "sentence" ? "sentence" : modeParam === "word-sentences" ? "word-sentences" : "match";

  const [loading, setLoading] = useState(true);
  const [wordChunks, setWordChunks] = useState<Word[][]>([]);
  const [chunkIndex, setChunkIndex] = useState(0);
  const [matchPhase, setMatchPhase] = useState<"match" | "recall">("match");
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [sentenceIndex, setSentenceIndex] = useState(0);
  const [exampleWords, setExampleWords] = useState<Word[]>([]);
  const [exampleIndex, setExampleIndex] = useState(0);

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const query = isAll ? "" : `lessons=${encodeURIComponent(lessonsParam)}&`;
      if (mode === "match") {
        const res = await apiFetch<{ words: Word[] }>(`/words?${query}limit=500`);
        setWordChunks(chunk(res.words, CHUNK_SIZE));
        setChunkIndex(0);
        setMatchPhase("match");
      } else if (mode === "sentence") {
        const res = await apiFetch<{ sentences: Sentence[] }>(`/sentences?${query}limit=500`);
        // Shuffle so every visit starts on a different sentence instead of
        // always the same first-inserted one.
        setSentences(shuffle(res.sentences));
        setSentenceIndex(0);
      } else {
        const res = await apiFetch<{ words: Word[] }>(`/words?${query}limit=500`);
        setExampleWords(shuffle(res.words.filter((w) => w.exampleSentenceEn.trim())));
        setExampleIndex(0);
      }
    } finally {
      setLoading(false);
    }
  }, [isAll, lessonsParam, mode]);

  useEffect(() => {
    // Fetch-on-mount against the separate Express API.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (user) load();
  }, [user, load]);

  const current = mode === "sentence" ? sentences[sentenceIndex] : undefined;
  const setChatContext = useAiChatContextStore((s) => s.setContext);
  useEffect(() => {
    setChatContext(current ? { korean: current.korean, englishWords: current.words.map((w) => w.text), formula: current.formula } : null);
    return () => setChatContext(null);
  }, [current, setChatContext]);

  if (!ready || !user) return null;

  const backHref = isAll ? "/all-words" : "/lessons";

  return (
    <div className="flex-1 px-4 sm:px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <Link href={backHref} className="text-sm text-foreground/50 hover:text-foreground">
            {t.backToLessons}
          </Link>
        </div>

        <PageHeader
          title={mode === "match" ? tMatch.title : tSentence.title}
          subtitle={mode === "match" ? tMatch.subtitle : tSentence.subtitle}
          count={
            loading
              ? undefined
              : mode === "match"
                ? wordChunks.reduce((sum, c) => sum + c.length, 0)
                : mode === "sentence"
                  ? sentences.length
                  : exampleWords.length
          }
          countLabel={mode === "match" ? t.wordsSuffix : t.sentencesSuffix}
        />

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-center py-20"
            >
              <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            </motion.div>
          ) : mode === "match" ? (
            wordChunks.length === 0 ? (
              <motion.p
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20 text-foreground/60"
              >
                {tMatch.empty}
              </motion.p>
            ) : chunkIndex >= wordChunks.length ? (
              <motion.div
                key="done"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16"
              >
                <p className="text-success font-bold text-lg mb-6">{t.roundDone}</p>
                <Link href={backHref}>
                  <Button>{t.backToLessons}</Button>
                </Link>
              </motion.div>
            ) : matchPhase === "recall" ? (
              <motion.div key="recall" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <RecallQuiz
                  words={wordChunks[chunkIndex]}
                  onFinish={() => {
                    setMatchPhase("match");
                    setChunkIndex((i) => i + 1);
                  }}
                />
              </motion.div>
            ) : (
              <motion.div key="board" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <MatchBoard
                  key={wordChunks[chunkIndex].map((w) => w._id).join(",")}
                  words={wordChunks[chunkIndex]}
                  onRoundComplete={() => setMatchPhase("recall")}
                />
                {wordChunks.length > 1 && (
                  <p className="mt-6 text-center text-xs text-foreground/40">
                    {chunkIndex + 1} / {wordChunks.length}
                  </p>
                )}
              </motion.div>
            )
          ) : mode === "sentence" ? (
            sentences.length === 0 ? (
              <motion.p
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20 text-foreground/60"
              >
                {tSentence.empty}
              </motion.p>
            ) : (
              <motion.div
                key={sentences[sentenceIndex]._id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <SentenceBuilder
                  sentence={sentences[sentenceIndex]}
                  onComplete={() => setSentenceIndex((i) => (i + 1) % sentences.length)}
                />
              </motion.div>
            )
          ) : exampleWords.length === 0 ? (
            <motion.p
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20 text-foreground/60"
            >
              {tSentence.empty}
            </motion.p>
          ) : (
            <motion.div
              key={exampleWords[exampleIndex]._id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <WordSentenceBuilder
                word={exampleWords[exampleIndex]}
                onComplete={() => setExampleIndex((i) => (i + 1) % exampleWords.length)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function LessonPracticePage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex justify-center py-20">
          <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
      }
    >
      <PracticeContent />
    </Suspense>
  );
}
