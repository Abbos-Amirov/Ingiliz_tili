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

type View = "list" | "practice";
type PracticePhase = "loading" | "playing" | "empty" | "summary";

export default function KnownWordsPage() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const t = useT("memoryPalace");
  const { fetchAnchors, unmarkKnown, fetchNextForRecall } = useMemoryPalace();

  const [view, setView] = useState<View>("list");
  const [anchors, setAnchors] = useState<MemoryAnchor[] | null>(null);

  const [practicePhase, setPracticePhase] = useState<PracticePhase>("loading");
  const [practiceAnchor, setPracticeAnchor] = useState<MemoryAnchor | null>(null);
  const [roundKey, setRoundKey] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [motivationSignal, setMotivationSignal] = useState(0);

  const loadList = useCallback(() => {
    fetchAnchors({ known: true }).then((res) => setAnchors(res.anchors));
  }, [fetchAnchors]);

  useEffect(() => {
    if (!ready || !user) return;
    loadList();
  }, [ready, user, loadList]);

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  async function handleUnmark(id: string) {
    if (!confirm(t.unmarkKnownConfirm)) return;
    await unmarkKnown(id);
    setAnchors((prev) => (prev ? prev.filter((a) => a._id !== id) : prev));
  }

  const loadNextPractice = useCallback(async () => {
    const res = await fetchNextForRecall({ knownPool: true });
    if (!res.anchor) {
      setPracticePhase("empty");
      return;
    }
    setPracticeAnchor(res.anchor);
    setRoundKey((k) => k + 1);
    setPracticePhase("playing");
  }, [fetchNextForRecall]);

  function startPractice() {
    setView("practice");
    setPracticePhase("loading");
    setCorrectCount(0);
    setIncorrectCount(0);
    loadNextPractice();
  }

  function handlePracticeResult(correct: boolean) {
    if (correct) {
      setCorrectCount((c) => c + 1);
      setMotivationSignal((s) => s + 1);
    } else {
      setIncorrectCount((c) => c + 1);
    }
    loadNextPractice();
  }

  if (!ready || !user) return null;

  return (
    <div className="flex-1 px-4 sm:px-6 py-10">
      <div className="mx-auto max-w-xl">
        {view === "practice" && <MotivationToast signal={motivationSignal} />}

        <Link href="/memory-palace" className="inline-block mb-2 text-sm font-medium text-foreground/50 hover:text-primary">
          {t.backToHub}
        </Link>
        <PageHeader title={t.knownPageTitle} subtitle={view === "list" ? t.knownPageSubtitle : undefined} compact />

        {view === "list" && (
          <>
            {anchors === null ? (
              <div className="flex justify-center py-16">
                <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
              </div>
            ) : anchors.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-4xl mb-3">🏆</p>
                <p className="font-bold text-lg mb-2">{t.knownEmptyTitle}</p>
                <p className="text-sm text-foreground/50 max-w-sm mx-auto">{t.knownEmptyDesc}</p>
              </Card>
            ) : (
              <>
                <div className="flex justify-center mb-5">
                  <Button onClick={startPractice}>{t.startKnownPracticeBtn}</Button>
                </div>
                <div className="grid gap-3">
                  {anchors.map((a) => (
                    <Card key={a._id} className="p-4 flex items-center gap-4">
                      {a.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={a.imageUrl}
                          alt=""
                          title={a.imageAttribution ? `Photo: ${a.imageAttribution.photographerName} (Unsplash)` : undefined}
                          className="h-14 w-14 object-cover rounded-lg shrink-0"
                        />
                      ) : (
                        <span className="h-14 w-14 rounded-lg bg-surface-muted flex items-center justify-center text-2xl shrink-0">🏆</span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold truncate">{a.wordId.english}</p>
                        <p className="text-xs text-foreground/50 truncate">{a.wordId.korean}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleUnmark(a._id)}
                        className="shrink-0 text-xs font-semibold text-foreground/40 hover:text-primary px-2 py-1.5"
                      >
                        {t.unmarkKnownBtn}
                      </button>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {view === "practice" && (
          <>
            {practicePhase === "loading" && (
              <div className="flex justify-center py-16">
                <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
              </div>
            )}

            {practicePhase === "empty" && (
              <Card className="p-8 text-center">
                <p className="text-4xl mb-3">🏆</p>
                <p className="font-bold text-lg mb-2">{t.knownPracticeEmptyTitle}</p>
                <p className="text-sm text-foreground/50 mb-6">{t.knownPracticeEmptyDesc}</p>
                <Button variant="ghost" onClick={() => setView("list")}>
                  {t.exitBtn}
                </Button>
              </Card>
            )}

            {practicePhase === "playing" && practiceAnchor && (
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
                  <MemoryRecallCard anchor={practiceAnchor} onResult={handlePracticeResult} />
                </motion.div>

                <div className="mt-6 flex justify-center">
                  <Button variant="ghost" onClick={() => setPracticePhase("summary")}>
                    {t.finishBtn}
                  </Button>
                </div>
              </>
            )}

            {practicePhase === "summary" && (
              <Card className="p-8 text-center">
                <p className="font-bold text-xl mb-6">
                  {t.sessionCorrectLabel}: {correctCount} · {t.sessionIncorrectLabel}: {incorrectCount}
                </p>
                <div className="flex justify-center gap-3">
                  <Button onClick={startPractice}>{t.continueBtn}</Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setView("list");
                      loadList();
                    }}
                  >
                    {t.exitBtn}
                  </Button>
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
