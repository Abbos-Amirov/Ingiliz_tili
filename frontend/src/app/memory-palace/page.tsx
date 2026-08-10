"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useT } from "@/hooks/useT";
import { useMemoryPalace } from "@/hooks/useMemoryPalace";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";

export default function MemoryPalacePage() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const t = useT("memoryPalace");
  const { fetchUnplacedWords, fetchAnchors } = useMemoryPalace();

  const [unplacedCount, setUnplacedCount] = useState<number | null>(null);
  const [totalAnchors, setTotalAnchors] = useState<number | null>(null);
  const [dueCount, setDueCount] = useState<number | null>(null);

  useEffect(() => {
    if (!ready || !user) return;
    fetchUnplacedWords().then((res) => setUnplacedCount(res.words.length));
    fetchAnchors().then((res) => {
      setTotalAnchors(res.anchors.length);
      const now = Date.now();
      setDueCount(res.anchors.filter((a) => new Date(a.dueDate).getTime() <= now).length);
    });
  }, [ready, user, fetchUnplacedWords, fetchAnchors]);

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  if (!ready || !user) return null;

  return (
    <div className="flex-1 px-4 sm:px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <PageHeader title={t.title} subtitle={t.subtitle} />

        <div className="grid grid-cols-3 gap-3 mb-8">
          <Card className="p-4 text-center">
            <p className="text-2xl font-extrabold text-primary">{totalAnchors ?? "…"}</p>
            <p className="text-xs text-foreground/50 mt-1">{t.totalAnchorsLabel}</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-extrabold text-success">{dueCount ?? "…"}</p>
            <p className="text-xs text-foreground/50 mt-1">{t.dueForRecallLabel}</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-extrabold text-primary">{unplacedCount ?? "…"}</p>
            <p className="text-xs text-foreground/50 mt-1">{t.unplacedTitle}</p>
          </Card>
        </div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid gap-4">
          <Link href="/memory-palace/create">
            <Card className="p-6 flex items-center gap-4 hover:border-primary/50 transition-colors cursor-pointer">
              <span className="text-3xl">📍</span>
              <div>
                <p className="font-bold text-lg">{t.placeWordsBtn}</p>
                {unplacedCount !== null && (
                  <p className="text-sm text-foreground/50">
                    {unplacedCount > 0
                      ? `${unplacedCount} ${t.unplacedCountSuffix}`
                      : t.unplacedEmpty}
                  </p>
                )}
              </div>
            </Card>
          </Link>

          <Link href="/memory-palace/recall">
            <Card className="p-6 flex items-center gap-4 hover:border-primary/50 transition-colors cursor-pointer">
              <span className="text-3xl">🧠</span>
              <div>
                <p className="font-bold text-lg">{t.recallBtn}</p>
                {dueCount !== null && totalAnchors !== null && (
                  <p className="text-sm text-foreground/50">
                    {totalAnchors > 0 ? `${dueCount} / ${totalAnchors}` : t.noAnchorsTitle}
                  </p>
                )}
              </div>
            </Card>
          </Link>

          <Link href="/memory-palace/journeys">
            <Card className="p-6 flex items-center gap-4 hover:border-primary/50 transition-colors cursor-pointer">
              <span className="text-3xl">🗺️</span>
              <div>
                <p className="font-bold text-lg">{t.journeysBtn}</p>
              </div>
            </Card>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
