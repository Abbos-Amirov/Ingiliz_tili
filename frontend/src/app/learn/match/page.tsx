"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useSrsActions, useDailyCheckIn } from "@/hooks/useSrsSession";
import { useSessionStore } from "@/store/session";
import { MatchBoard } from "@/components/match/MatchBoard";
import { useT } from "@/hooks/useT";
import type { Word } from "@/lib/types";

export default function MatchPage() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const { fetchNextBatch } = useSrsActions();
  const setLastRoundWords = useSessionStore((s) => s.setLastRoundWords);
  const t = useT("match");
  useDailyCheckIn();

  const [words, setWords] = useState<Word[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  const loadRound = useCallback(async () => {
    setLoading(true);
    try {
      const batch = await fetchNextBatch("match", 8);
      setWords(batch);
    } finally {
      setLoading(false);
    }
  }, [fetchNextBatch]);

  useEffect(() => {
    // Fetch-on-mount against the separate Express API; setLoading(true) fires
    // synchronously before the await, which is the intended loading-state pattern.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (user) loadRound();
  }, [user, loadRound]);

  function handleRoundComplete(roundWords: Word[]) {
    setLastRoundWords(roundWords);
    router.push("/learn/recall");
  }

  if (!ready || !user) return null;

  return (
    <div className="flex-1 px-4 sm:px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-2xl sm:text-3xl font-extrabold">{t.title}</h1>
          <p className="text-foreground/60 mt-1.5 text-sm sm:text-base">{t.subtitle}</p>
        </div>

        <AnimatePresence mode="wait">
          {loading || !words ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-center py-20"
            >
              <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            </motion.div>
          ) : words.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20 text-foreground/60"
            >
              {t.empty}
            </motion.div>
          ) : (
            <motion.div key="round" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <MatchBoard
                key={words.map((w) => w._id).join(",")}
                words={words}
                onRoundComplete={handleRoundComplete}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
