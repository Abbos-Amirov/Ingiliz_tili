"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useSessionStore } from "@/store/session";
import { RecallQuiz } from "@/components/recall/RecallQuiz";
import { WordSentenceBuilder } from "@/components/lessons/WordSentenceBuilder";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { useT } from "@/hooks/useT";

export default function RecallPage() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const words = useSessionStore((s) => s.lastRoundWords);
  const t = useT("recall");
  const tLessons = useT("lessons");
  const [summary, setSummary] = useState<{ correct: number; total: number } | null>(null);
  const [buildingSentences, setBuildingSentences] = useState(false);
  const [sentenceIndex, setSentenceIndex] = useState(0);

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  useEffect(() => {
    if (ready && user && words.length === 0) router.replace("/learn/match");
  }, [ready, user, words, router]);

  if (!ready || !user || words.length === 0) return null;

  // Each of this round's own words carries an admin-authored example
  // sentence — building from exactly these (instead of routing away to the
  // unrelated curated /learn/sentence pool) keeps sentence practice tied to
  // the words the learner just matched and recalled.
  const sentenceWords = words.filter((w) => w.exampleSentenceEn.trim());

  return (
    <div className="flex-1 px-4 sm:px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <PageHeader title={t.title} subtitle={t.subtitle} count={words.length} countLabel={tLessons.wordsSuffix} />

        {!summary ? (
          <RecallQuiz
            words={words}
            onFinish={(results) =>
              setSummary({
                correct: results.filter((r) => r.correct).length,
                total: results.length,
              })
            }
          />
        ) : buildingSentences ? (
          sentenceIndex >= sentenceWords.length ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-10"
            >
              <p className="text-success font-bold text-lg mb-8">{tLessons.roundDone}</p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link href="/learn/match">
                  <Button>{t.anotherRound}</Button>
                </Link>
                <Link href="/progress">
                  <Button variant="ghost">{t.viewProgress}</Button>
                </Link>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={sentenceWords[sentenceIndex]._id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25 }}
            >
              <WordSentenceBuilder
                word={sentenceWords[sentenceIndex]}
                onComplete={() => setSentenceIndex((i) => i + 1)}
              />
            </motion.div>
          )
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-10"
          >
            <p className="text-5xl font-extrabold gradient-text mb-2">
              {summary.correct}/{summary.total}
            </p>
            <p className="text-foreground/60 mb-8">{t.resultSuffix}</p>
            <div className="flex flex-wrap justify-center gap-3">
              {sentenceWords.length > 0 && (
                <Button onClick={() => setBuildingSentences(true)}>{t.goSentence}</Button>
              )}
              <Link href="/learn/match">
                <Button variant="secondary">{t.anotherRound}</Button>
              </Link>
              <Link href="/progress">
                <Button variant="ghost">{t.viewProgress}</Button>
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
