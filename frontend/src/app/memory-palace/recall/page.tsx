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
import { RoomScroller } from "@/components/memoryPalace/RoomScroller";
import type { MemoryAnchor, PalaceRoomKey } from "@/lib/types";

type Phase = "select-room" | "loading" | "playing" | "empty" | "summary";

export default function MemoryPalaceRecallPage() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const t = useT("memoryPalace");
  const { fetchNextForRecall, fetchRoomCounts } = useMemoryPalace();

  const [phase, setPhase] = useState<Phase>("select-room");
  const [anchor, setAnchor] = useState<MemoryAnchor | null>(null);
  const [roundKey, setRoundKey] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [motivationSignal, setMotivationSignal] = useState(0);
  const [roomFilter, setRoomFilter] = useState<PalaceRoomKey | null>(null);
  const [countByRoomKey, setCountByRoomKey] = useState<Partial<Record<PalaceRoomKey, number>>>({});

  const loadNext = useCallback(
    async (roomKey?: PalaceRoomKey | null) => {
      const res = await fetchNextForRecall(roomKey ?? undefined);
      if (!res.anchor) {
        setPhase("empty");
        return;
      }
      setAnchor(res.anchor);
      setRoundKey((k) => k + 1);
      setPhase("playing");
    },
    [fetchNextForRecall],
  );

  useEffect(() => {
    if (!ready || !user) return;
    fetchRoomCounts().then((res) => setCountByRoomKey(res.countByRoomKey));
  }, [ready, user, fetchRoomCounts]);

  function startSession() {
    setPhase("loading");
    setCorrectCount(0);
    setIncorrectCount(0);
    loadNext(roomFilter);
  }

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
    loadNext(roomFilter);
  }

  if (!ready || !user) return null;

  return (
    <div className="flex-1 px-4 sm:px-6 py-10">
      <div className="mx-auto max-w-xl">
        <MotivationToast signal={motivationSignal} />
        <Link href="/memory-palace" className="inline-block mb-2 text-sm font-medium text-foreground/50 hover:text-primary">
          {t.backToHub}
        </Link>
        <PageHeader title={t.recallPageTitle} compact />

        {phase === "select-room" && (
          <Card className="p-6">
            <p className="text-sm font-semibold mb-3">{t.recallRoomFilterTitle}</p>
            <RoomScroller selectedKey={roomFilter} onSelect={setRoomFilter} noneLabel={t.recallAllRoomsOption} countByRoomKey={countByRoomKey} />
            <div className="flex justify-center mt-6">
              <Button onClick={startSession}>{t.recallStartBtn}</Button>
            </div>
          </Card>
        )}

        {phase === "loading" && (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
        )}

        {phase === "empty" && (
          <Card className="p-8 text-center">
            <p className="text-4xl mb-3">🧠</p>
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
              <Button onClick={startSession}>{t.continueBtn}</Button>
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
