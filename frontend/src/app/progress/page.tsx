"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/lib/api";
import type { UserStats, Word } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { PageHeader } from "@/components/ui/PageHeader";
import { useT } from "@/hooks/useT";

export default function ProgressPage() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const t = useT("progress");
  const [stats, setStats] = useState<UserStats | null>(null);
  const [difficultWords, setDifficultWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      apiFetch<{ stats: UserStats }>("/stats/me"),
      apiFetch<{ words: Word[] }>("/srs/difficult-words"),
    ])
      .then(([statsRes, wordsRes]) => {
        setStats(statsRes.stats);
        setDifficultWords(wordsRes.words);
      })
      .finally(() => setLoading(false));
  }, [user]);

  if (!ready || !user) return null;

  return (
    <div className="flex-1 px-4 sm:px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <PageHeader title={t.title} />

        {loading || !stats ? (
          <div className="flex justify-center py-20">
            <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatTile emoji="🔥" value={stats.currentStreak} label={t.dailyStreak} />
              <StatTile emoji="🏆" value={stats.longestStreak} label={t.longestStreak} />
              <StatTile emoji="📘" value={stats.totalWordsLearned} label={t.totalLearned} />
              <StatTile emoji="✅" value={stats.wordsLearnedToday} label={t.today} />
            </div>

            <Card className="p-6">
              <ProgressBar
                value={Math.min(stats.wordsLearnedToday, stats.dailyGoal)}
                total={stats.dailyGoal}
                label={t.dailyGoal}
              />
            </Card>

            {difficultWords.length > 0 && (
              <Card className="p-6">
                <h2 className="font-bold text-lg mb-1">{t.difficultWords}</h2>
                <p className="text-sm text-foreground/60 mb-4">{t.difficultWordsDesc}</p>
                <div className="flex flex-wrap gap-2">
                  {difficultWords.map((w) => (
                    <span
                      key={w._id}
                      className="px-3 py-1.5 rounded-full bg-danger-soft text-danger text-sm font-semibold"
                    >
                      {w.english} — {w.korean}
                    </span>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatTile({ emoji, value, label }: { emoji: string; value: number; label: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="p-5 text-center">
        <div className="text-2xl mb-1">{emoji}</div>
        <div className="text-2xl font-extrabold gradient-text">{value}</div>
        <div className="text-xs text-foreground/60 mt-1">{label}</div>
      </Card>
    </motion.div>
  );
}
