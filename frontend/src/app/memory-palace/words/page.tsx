"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useT } from "@/hooks/useT";
import { useMemoryPalace } from "@/hooks/useMemoryPalace";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { MemoryAnchor, MemoryJourney } from "@/lib/types";

export default function MemoryPalaceWordsPage() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const t = useT("memoryPalace");
  const { fetchAnchors, fetchJourneys, deleteAnchor } = useMemoryPalace();

  const [anchors, setAnchors] = useState<MemoryAnchor[] | null>(null);
  const [journeys, setJourneys] = useState<MemoryJourney[] | null>(null);

  useEffect(() => {
    if (!ready || !user) return;
    fetchAnchors().then((res) => setAnchors(res.anchors));
    fetchJourneys().then((res) => setJourneys(res.journeys));
  }, [ready, user, fetchAnchors, fetchJourneys]);

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  async function handleDelete(id: string) {
    if (!confirm(t.deleteAnchorConfirm)) return;
    await deleteAnchor(id);
    setAnchors((prev) => (prev ? prev.filter((a) => a._id !== id) : prev));
  }

  if (!ready || !user) return null;

  const journeyTitleById = new Map((journeys ?? []).map((j) => [j._id, j.title]));

  return (
    <div className="flex-1 px-4 sm:px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <Link href="/memory-palace" className="inline-block mb-2 text-sm font-medium text-foreground/50 hover:text-primary">
          {t.backToHub}
        </Link>
        <PageHeader title={t.myWordsPageTitle} subtitle={t.myWordsPageSubtitle} compact />

        {anchors === null ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
        ) : anchors.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-4xl mb-3">📋</p>
            <p className="font-bold text-lg mb-2">{t.myWordsEmptyTitle}</p>
            <p className="text-sm text-foreground/50 max-w-sm mx-auto mb-5">{t.myWordsEmptyDesc}</p>
            <Link href="/memory-palace/create">
              <Button>{t.placeWordsBtn}</Button>
            </Link>
          </Card>
        ) : (
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
                  <span className="h-14 w-14 rounded-lg bg-surface-muted flex items-center justify-center text-2xl shrink-0">
                    📝
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold truncate">{a.wordId.english}</p>
                  <p className="text-xs text-foreground/50 truncate">{a.wordId.korean}</p>
                  {a.journeyId && journeyTitleById.get(a.journeyId) && (
                    <p className="text-xs text-primary mt-1 truncate">🗺️ {journeyTitleById.get(a.journeyId)}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(a._id)}
                  aria-label="delete"
                  className="text-foreground/30 hover:text-danger text-lg leading-none p-2 shrink-0"
                >
                  🗑
                </button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
