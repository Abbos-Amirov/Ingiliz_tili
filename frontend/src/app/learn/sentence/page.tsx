"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/lib/api";
import type { Sentence, Difficulty } from "@/lib/types";
import { SentenceBuilder } from "@/components/sentence/SentenceBuilder";
import { PageHeader } from "@/components/ui/PageHeader";
import { AiChatWidget } from "@/components/chat/AiChatWidget";
import { useT } from "@/hooks/useT";

export default function SentencePage() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const t = useT("sentence");
  const tLessons = useT("lessons");

  const levels: { value: Difficulty; label: string }[] = [
    { value: "beginner", label: t.levels.beginner },
    { value: "intermediate", label: t.levels.intermediate },
    { value: "advanced", label: t.levels.advanced },
  ];

  const [level, setLevel] = useState<Difficulty>("beginner");
  const [pool, setPool] = useState<Sentence[]>([]);
  const [current, setCurrent] = useState<Sentence | null>(null);
  const [loading, setLoading] = useState(true);
  const [roundIndex, setRoundIndex] = useState(0);

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  const loadPool = useCallback(async (lvl: Difficulty) => {
    setLoading(true);
    try {
      const res = await apiFetch<{ sentences: Sentence[] }>(`/sentences?level=${lvl}&limit=50`);
      setPool(res.sentences);
      setCurrent(res.sentences.length > 0 ? res.sentences[0] : null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch-on-mount/level-change against the separate Express API.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (user) loadPool(level);
  }, [user, level, loadPool]);

  function nextSentence() {
    if (pool.length === 0) return;
    const idx = (roundIndex + 1) % pool.length;
    setRoundIndex(idx);
    setCurrent(pool[idx]);
  }

  if (!ready || !user) return null;

  return (
    <div className="flex-1 px-4 sm:px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <PageHeader title={t.title} subtitle={t.subtitle} count={pool.length} countLabel={tLessons.sentencesSuffix} />

        <div className="flex justify-center gap-2 mb-8">
          {levels.map((l) => (
            <button
              key={l.value}
              onClick={() => {
                setLevel(l.value);
                setRoundIndex(0);
              }}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors min-h-11 ${
                level === l.value
                  ? "gradient-primary text-white"
                  : "bg-surface-muted text-foreground/70 hover:text-foreground"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>

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
          ) : !current ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20 text-foreground/60"
            >
              {t.empty}
            </motion.div>
          ) : (
            <motion.div
              key={current._id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <SentenceBuilder sentence={current} onComplete={nextSentence} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {current && (
        <AiChatWidget
          key={current._id}
          context={{ korean: current.korean, englishWords: current.words.map((w) => w.text), formula: current.formula }}
        />
      )}
    </div>
  );
}
