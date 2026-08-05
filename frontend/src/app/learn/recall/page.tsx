"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useSessionStore } from "@/store/session";
import { RecallQuiz } from "@/components/recall/RecallQuiz";
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

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  useEffect(() => {
    if (ready && user && words.length === 0) router.replace("/learn/match");
  }, [ready, user, words, router]);

  if (!ready || !user || words.length === 0) return null;

  return (
    <div className="flex-1 px-4 sm:px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <PageHeader title={t.title} subtitle={t.subtitle} count={words.length} countLabel={tLessons.wordsSuffix} />

        {summary ? (
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
              <Link href="/learn/sentence">
                <Button>{t.goSentence}</Button>
              </Link>
              <Link href="/learn/match">
                <Button variant="secondary">{t.anotherRound}</Button>
              </Link>
              <Link href="/progress">
                <Button variant="ghost">{t.viewProgress}</Button>
              </Link>
            </div>
          </motion.div>
        ) : (
          <RecallQuiz
            words={words}
            onFinish={(results) =>
              setSummary({
                correct: results.filter((r) => r.correct).length,
                total: results.length,
              })
            }
          />
        )}
      </div>
    </div>
  );
}
