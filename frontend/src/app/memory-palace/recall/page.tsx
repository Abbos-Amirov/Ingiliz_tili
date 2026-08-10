"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useT } from "@/hooks/useT";
import { useMemoryPalace } from "@/hooks/useMemoryPalace";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MotivationToast } from "@/components/ui/MotivationToast";
import { MemoryRecallCard } from "@/components/memoryPalace/MemoryRecallCard";
import type { MemoryAnchor } from "@/lib/types";

type Phase = "loading" | "playing" | "empty" | "summary";

export default function MemoryPalaceRecallPage() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const t = useT("memoryPalace");
  const { fetchNextForRecall } = useMemoryPalace();

  const [phase, setPhase] = useState<Phase>("loading");
  const [anchor, setAnchor] = useState<MemoryAnchor | null>(null);
  const [roundKey, setRoundKey] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [motivationSignal, setMotivationSignal] = useState(0);

  const loadNext = useCallback(async () => {
    const res = await fetchNextForRecall();
    if (!res.anchor) {
      setPhase("empty");
      return;
    }
    setAnchor(res.anchor);
    setRoundKey((k) => k + 1);
    setPhase("playing");
  }, [fetchNextForRecall]);

  useEffect(() => {
    if (!ready || !user) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadNext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, user]);

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  function handleResult(correct: boolean) {
    if (correct) {
      setCorrectCount((c) => c + 1);
      setMotivationSignal((s) => s + 1);
    } else {
      setIncorrectCount((c) => c + 1);
    }
    loadNext();
  }

  if (!ready || !user) return null;

  return (
    <div className="flex-1 px-4 sm:px-6 py-10">
      <div className="mx-auto max-w-xl">
        <MotivationToast signal={motivationSignal} />
        <PageHeader title={t.recallPageTitle} />

        {phase === "loading" && (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
        )}

        {phase === "empty" && (
          <Card className="p-8 text-center">
            <p className="font-bold text-lg mb-2">{t.noAnchorsTitle}</p>
            <p className="text-sm text-foreground/50 mb-6">{t.noAnchorsSubtitle}</p>
            <Link href="/memory-palace/create">
              <Button>{t.placeWordsBtn}</Button>
            </Link>
          </Card>
        )}

        {phase === "playing" && anchor && (
          <>
            <div className="flex justify-center gap-6 mb-5 text-sm font-semibold">
              <span className="text-success">
                {t.sessionCorrectLabel}: {correctCount}
              </span>
              <span className="text-danger">
                {t.sessionIncorrectLabel}: {incorrectCount}
              </span>
            </div>

            <motion.div key={roundKey} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }}>
              <MemoryRecallCard anchor={anchor} onResult={handleResult} />
            </motion.div>

            <div className="mt-6 flex justify-center">
              <Button variant="ghost" onClick={() => setPhase("summary")}>
                {t.finishBtn}
              </Button>
            </div>
          </>
        )}

        {phase === "summary" && (
          <Card className="p-8 text-center">
            <p className="font-bold text-xl mb-6">
              {t.sessionCorrectLabel}: {correctCount} · {t.sessionIncorrectLabel}: {incorrectCount}
            </p>
            <div className="flex justify-center gap-3">
              <Button
                onClick={() => {
                  setCorrectCount(0);
                  setIncorrectCount(0);
                  setPhase("loading");
                  loadNext();
                }}
              >
                {t.continueBtn}
              </Button>
              <Button variant="ghost" onClick={() => router.push("/memory-palace")}>
                {t.exitBtn}
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
