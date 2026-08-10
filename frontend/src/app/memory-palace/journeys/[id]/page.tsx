"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useT } from "@/hooks/useT";
import { useMemoryPalace } from "@/hooks/useMemoryPalace";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MotivationToast } from "@/components/ui/MotivationToast";
import { MemoryRecallCard } from "@/components/memoryPalace/MemoryRecallCard";
import type { MemoryAnchor, MemoryJourney } from "@/lib/types";

type Mode = "list" | "recall" | "summary";

export default function MemoryJourneyDetailPage() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const t = useT("memoryPalace");
  const { fetchJourney } = useMemoryPalace();

  const [journey, setJourney] = useState<MemoryJourney | null>(null);
  const [anchors, setAnchors] = useState<MemoryAnchor[] | null>(null);
  const [mode, setMode] = useState<Mode>("list");
  const [index, setIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [motivationSignal, setMotivationSignal] = useState(0);

  useEffect(() => {
    if (!ready || !user || !params.id) return;
    fetchJourney(params.id).then((res) => {
      setJourney(res.journey);
      setAnchors(res.anchors);
    });
  }, [ready, user, params.id, fetchJourney]);

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  function startRecall() {
    setIndex(0);
    setCorrectCount(0);
    setMode("recall");
  }

  function handleResult(correct: boolean) {
    if (correct) {
      setCorrectCount((c) => c + 1);
      setMotivationSignal((s) => s + 1);
    }
    if (!anchors) return;
    if (index + 1 < anchors.length) {
      setIndex((i) => i + 1);
    } else {
      setMode("summary");
    }
  }

  if (!ready || !user) return null;
  if (!journey || !anchors) {
    return (
      <div className="flex-1 flex justify-center py-20">
        <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 px-4 sm:px-6 py-10">
      <div className="mx-auto max-w-xl">
        <MotivationToast signal={motivationSignal} />

        {mode === "list" && (
          <>
            <Link href="/memory-palace/journeys" className="text-sm font-medium text-foreground/50 hover:text-primary">
              {t.journeyDetailBackLink}
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold mt-3 mb-1">{journey.title}</h1>
            {journey.description && <p className="text-foreground/60 mb-6">{journey.description}</p>}

            <div className="flex gap-3 mb-6">
              <Button onClick={startRecall} disabled={anchors.length === 0}>
                {t.startJourneyRecallBtn}
              </Button>
              <Link href={`/memory-palace/create?journeyId=${journey._id}`}>
                <Button variant="secondary">{t.addStopBtn}</Button>
              </Link>
            </div>

            <p className="text-sm font-semibold text-foreground/50 mb-3">{t.stopsTitle}</p>
            {anchors.length === 0 ? (
              <Card className="p-8 text-center text-sm text-foreground/50">{t.journeyEmpty}</Card>
            ) : (
              <div className="grid gap-3">
                {anchors.map((a, i) => (
                  <Card key={a._id} className="p-4 flex items-center gap-4">
                    <span className="shrink-0 h-8 w-8 rounded-full gradient-primary text-white text-sm font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    {a.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={a.imageUrl}
                        alt=""
                        title={a.imageAttribution ? `Photo: ${a.imageAttribution.photographerName} (Unsplash)` : undefined}
                        className="h-12 w-12 object-cover rounded-lg"
                      />
                    ) : (
                      <span className="h-12 w-12 rounded-lg bg-surface-muted flex items-center justify-center text-xl">📝</span>
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{a.wordId.english}</p>
                      <p className="text-xs text-foreground/50 truncate">{a.wordId.korean}</p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {mode === "recall" && anchors[index] && (
          <>
            <p className="text-center text-sm font-semibold text-foreground/50 mb-4">
              {t.stopNumberPrefix} {index + 1} / {anchors.length}
            </p>
            <motion.div key={anchors[index]._id} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }}>
              <MemoryRecallCard anchor={anchors[index]} onResult={handleResult} />
            </motion.div>
          </>
        )}

        {mode === "summary" && (
          <Card className="p-8 text-center">
            <h2 className="font-bold text-xl mb-4">{t.journeySummaryTitle}</h2>
            <p className="text-lg mb-6">
              {anchors.length} {t.journeySummaryStats} {correctCount} {t.journeySummaryCorrect}
            </p>
            <div className="flex justify-center gap-3">
              <Button onClick={startRecall}>{t.restartJourneyBtn}</Button>
              <Button variant="ghost" onClick={() => setMode("list")}>
                {t.exitBtn}
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
