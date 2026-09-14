"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useT } from "@/hooks/useT";
import { apiFetch } from "@/lib/api";
import type { ShadowingVideo, Difficulty } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function ShadowingListPage() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const t = useT("shadowing");
  const tSentence = useT("sentence");

  const [level, setLevel] = useState<Difficulty | "all">("all");
  const [videos, setVideos] = useState<ShadowingVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  const load = useCallback(async (lvl: Difficulty | "all") => {
    setLoading(true);
    try {
      const query = lvl === "all" ? "" : `?level=${lvl}`;
      const res = await apiFetch<{ videos: ShadowingVideo[] }>(`/shadowing${query}`);
      setVideos(res.videos);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (user) load(level);
  }, [user, level, load]);

  if (!ready || !user) return null;

  const levels: (Difficulty | "all")[] = ["all", "beginner", "intermediate", "advanced"];

  return (
    <div className="flex-1 px-4 sm:px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <PageHeader title={t.title} subtitle={t.subtitle} count={videos.length} countLabel={t.videosSuffix} />

        <div className="flex justify-center gap-2 mb-8 flex-wrap">
          {levels.map((lvl) => (
            <button
              key={lvl}
              onClick={() => setLevel(lvl)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors min-h-11 ${
                level === lvl ? "gradient-primary text-white" : "bg-surface-muted text-foreground/70 hover:text-foreground"
              }`}
            >
              {lvl === "all" ? "Hammasi" : tSentence.levels[lvl]}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-center py-20">
              <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            </motion.div>
          ) : videos.length === 0 ? (
            <motion.p key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 text-foreground/60">
              {t.empty}
            </motion.p>
          ) : (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-4">
              {videos.map((v) => (
                <Link key={v._id} href={`/shadowing/${v._id}`}>
                  <Card className="p-5 flex items-center justify-between gap-4 hover:border-primary/50 transition-colors cursor-pointer">
                    <div className="flex items-center gap-4">
                      <span className="text-3xl">🎬</span>
                      <div>
                        <p className="font-bold">{v.title}</p>
                        <p className="text-xs text-foreground/50 mt-1">
                          {tSentence.levels[v.level]} · {formatDuration(v.duration)}
                        </p>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
