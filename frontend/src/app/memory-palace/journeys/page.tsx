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
import { Modal } from "@/components/ui/Modal";
import type { MemoryJourney } from "@/lib/types";

export default function MemoryJourneysPage() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const t = useT("memoryPalace");
  const { fetchJourneys, createJourney, deleteJourney } = useMemoryPalace();

  const [journeys, setJourneys] = useState<MemoryJourney[] | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!ready || !user) return;
    fetchJourneys().then((res) => setJourneys(res.journeys));
  }, [ready, user, fetchJourneys]);

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  async function handleCreate() {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const res = await createJourney(title.trim(), description.trim());
      setJourneys((prev) => [res.journey, ...(prev ?? [])]);
      setTitle("");
      setDescription("");
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(t.deleteJourneyConfirm)) return;
    await deleteJourney(id);
    setJourneys((prev) => (prev ? prev.filter((j) => j._id !== id) : prev));
  }

  if (!ready || !user) return null;

  return (
    <div className="flex-1 px-4 sm:px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <Link href="/memory-palace" className="inline-block mb-4 text-sm font-medium text-foreground/50 hover:text-primary">
          {t.backToHub}
        </Link>
        <PageHeader title={t.journeysPageTitle} subtitle={t.journeysPageSubtitle} />

        <div className="flex justify-center mb-6">
          <Button onClick={() => setModalOpen(true)}>{t.newJourneyBtn}</Button>
        </div>

        {journeys === null ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
        ) : journeys.length === 0 ? (
          <Card className="p-8 text-center text-sm text-foreground/50">{t.journeysEmpty}</Card>
        ) : (
          <div className="grid gap-3">
            {journeys.map((j) => (
              <Card key={j._id} className="p-5 flex items-center justify-between gap-3">
                <Link href={`/memory-palace/journeys/${j._id}`} className="flex-1 min-w-0">
                  <p className="font-bold">{j.title}</p>
                  {j.description && <p className="text-sm text-foreground/50 truncate">{j.description}</p>}
                  <p className="text-xs text-foreground/40 mt-1">
                    {j.stopCount ?? 0} {t.stopsSuffix}
                  </p>
                </Link>
                <button
                  type="button"
                  onClick={() => handleDelete(j._id)}
                  aria-label="delete"
                  className="text-foreground/30 hover:text-danger text-lg leading-none p-2"
                >
                  🗑
                </button>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={t.newJourneyBtn}>
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-xs font-semibold text-foreground/50 mb-2">{t.newJourneyThemesLabel}</p>
            <div className="grid grid-cols-2 gap-2">
              {t.journeyThemeSuggestions.map((theme) => (
                <button
                  key={theme}
                  type="button"
                  onClick={() => setTitle(theme)}
                  className={`px-3 py-2 rounded-xl border-2 text-sm font-medium text-left transition-colors ${
                    title === theme
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-surface text-foreground/70 hover:border-primary/40"
                  }`}
                >
                  {theme}
                </button>
              ))}
            </div>
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t.journeyDescPlaceholder}
            rows={2}
            className="w-full rounded-xl border-2 border-border bg-surface-muted px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary resize-none"
          />
          <Button onClick={handleCreate} disabled={saving || !title.trim()}>
            {saving ? "…" : t.createJourneyBtn}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
