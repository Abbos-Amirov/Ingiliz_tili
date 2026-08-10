"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useT } from "@/hooks/useT";
import { useMemoryPalace } from "@/hooks/useMemoryPalace";
import { compressImage } from "@/lib/imageCompression";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { MemoryJourney, Word } from "@/lib/types";

const NEW_JOURNEY_VALUE = "__new__";
const NONE_JOURNEY_VALUE = "";

function CreateContent() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useT("memoryPalace");
  const { fetchUnplacedWords, fetchJourneys, createJourney, createAnchor } = useMemoryPalace();

  const presetJourneyId = searchParams.get("journeyId") ?? "";

  const [words, setWords] = useState<Word[] | null>(null);
  const [journeys, setJourneys] = useState<MemoryJourney[] | null>(null);
  const [search, setSearch] = useState("");
  const [selectedWord, setSelectedWord] = useState<Word | null>(null);

  const [mode, setMode] = useState<"image" | "text" | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [textDescription, setTextDescription] = useState("");

  const [journeySelection, setJourneySelection] = useState<string>(presetJourneyId || NONE_JOURNEY_VALUE);
  const [newJourneyTitle, setNewJourneyTitle] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedSignal, setSavedSignal] = useState(0);

  useEffect(() => {
    if (!ready || !user) return;
    fetchUnplacedWords().then((res) => setWords(res.words));
    fetchJourneys().then((res) => setJourneys(res.journeys));
  }, [ready, user, fetchUnplacedWords, fetchJourneys]);

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  const filteredWords = useMemo(() => {
    if (!words) return [];
    const q = search.trim().toLowerCase();
    if (!q) return words;
    return words.filter((w) => w.english.toLowerCase().includes(q) || w.korean.includes(q));
  }, [words, search]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCompressing(true);
    setError(null);
    try {
      const base64 = await compressImage(file);
      setImageBase64(base64);
    } catch {
      setError(t.missingContent);
    } finally {
      setCompressing(false);
    }
  }

  function resetForm() {
    setSelectedWord(null);
    setMode(null);
    setImageBase64(null);
    setTextDescription("");
    setSearch("");
  }

  async function handleSave() {
    if (!selectedWord) return;
    if (!imageBase64 && !textDescription.trim()) {
      setError(t.missingContent);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      let journeyId: string | undefined;
      if (journeySelection === NEW_JOURNEY_VALUE) {
        if (!newJourneyTitle.trim()) {
          setError(t.missingContent);
          setSaving(false);
          return;
        }
        const res = await createJourney(newJourneyTitle.trim());
        journeyId = res.journey._id;
        setJourneys((prev) => [res.journey, ...(prev ?? [])]);
      } else if (journeySelection) {
        journeyId = journeySelection;
      }

      const journey = journeys?.find((j) => j._id === journeyId);
      const journeyOrder = journey ? (journey.stopCount ?? 0) : undefined;

      await createAnchor({
        wordId: selectedWord._id,
        imageBase64: imageBase64 ?? undefined,
        textDescription: textDescription.trim() || undefined,
        journeyId,
        journeyOrder,
      });

      setSavedSignal((s) => s + 1);
      setWords((prev) => (prev ? prev.filter((w) => w._id !== selectedWord._id) : prev));
      resetForm();
      setNewJourneyTitle("");
    } catch {
      setError(t.missingContent);
    } finally {
      setSaving(false);
    }
  }

  if (!ready || !user) return null;

  return (
    <div className="flex-1 px-4 sm:px-6 py-10">
      <div className="mx-auto max-w-xl">
        <PageHeader title={t.createPageTitle} subtitle={t.createPageSubtitle} />

        <Card className="p-4 mb-6 bg-primary/5 border-primary/20">
          <p className="text-sm text-foreground/70">{t.tipText}</p>
        </Card>

        <AnimatePresence>
          {savedSignal > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 rounded-xl bg-success-soft text-success text-center font-semibold py-2.5"
            >
              {t.savedToast}
            </motion.div>
          )}
        </AnimatePresence>

        {!selectedWord ? (
          <Card className="p-6">
            <p className="text-sm font-semibold mb-3">{t.selectWordLabel}</p>
            {words === null ? (
              <div className="flex justify-center py-10">
                <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
              </div>
            ) : words.length === 0 ? (
              <p className="text-sm text-foreground/50 text-center py-6">{t.noUnplacedWords}</p>
            ) : (
              <>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t.selectWordPlaceholder}
                  className="w-full rounded-xl border-2 border-border bg-surface-muted px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary mb-3"
                />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-80 overflow-y-auto">
                  {filteredWords.map((w) => (
                    <button
                      key={w._id}
                      type="button"
                      onClick={() => setSelectedWord(w)}
                      className="px-3 py-2.5 rounded-xl border-2 border-border bg-surface text-left hover:border-primary/40 transition-colors"
                    >
                      <p className="font-semibold text-sm">{w.english}</p>
                      <p className="text-xs text-foreground/50">{w.korean}</p>
                    </button>
                  ))}
                </div>
              </>
            )}
          </Card>
        ) : (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="font-extrabold text-xl">{selectedWord.english}</p>
                <p className="text-sm text-foreground/50">{selectedWord.korean}</p>
              </div>
              <button
                type="button"
                onClick={resetForm}
                className="text-xs font-medium text-foreground/40 hover:text-primary"
              >
                ✕
              </button>
            </div>

            <div className="flex justify-center gap-2 mb-5">
              <button
                type="button"
                onClick={() => setMode("image")}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                  mode === "image" ? "gradient-primary text-white" : "bg-surface-muted text-foreground/70"
                }`}
              >
                {t.cameraBtn}
              </button>
              <button
                type="button"
                onClick={() => setMode("text")}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                  mode === "text" ? "gradient-primary text-white" : "bg-surface-muted text-foreground/70"
                }`}
              >
                {t.descriptionBtn}
              </button>
            </div>

            {mode === "image" && (
              <div className="mb-5 text-center">
                {imageBase64 ? (
                  <div className="flex flex-col items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imageBase64} alt="" className="h-48 w-48 object-cover rounded-2xl border border-border" />
                    <label className="text-sm font-medium text-primary cursor-pointer">
                      {t.changePhotoBtn}
                      <input type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
                    </label>
                  </div>
                ) : (
                  <label className="inline-flex flex-col items-center justify-center gap-2 h-40 w-40 rounded-2xl border-2 border-dashed border-border cursor-pointer hover:border-primary/40 transition-colors">
                    {compressing ? (
                      <span className="text-sm text-foreground/50">{t.compressingImage}</span>
                    ) : (
                      <span className="text-3xl">📷</span>
                    )}
                    <input type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
                  </label>
                )}
              </div>
            )}

            {mode === "text" && (
              <textarea
                value={textDescription}
                onChange={(e) => setTextDescription(e.target.value)}
                placeholder={t.descriptionPlaceholder}
                rows={3}
                className="w-full rounded-xl border-2 border-border bg-surface-muted px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary mb-5 resize-none"
              />
            )}

            {journeys !== null && (
              <div className="mb-6">
                <p className="text-xs font-semibold text-foreground/50 mb-2">{t.journeyLabel}</p>
                <select
                  value={journeySelection}
                  onChange={(e) => setJourneySelection(e.target.value)}
                  className="w-full rounded-xl border-2 border-border bg-surface-muted px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value={NONE_JOURNEY_VALUE}>{t.journeyNone}</option>
                  {journeys.map((j) => (
                    <option key={j._id} value={j._id}>
                      {j.title}
                    </option>
                  ))}
                  <option value={NEW_JOURNEY_VALUE}>{t.newJourneyOption}</option>
                </select>
                {journeySelection === NEW_JOURNEY_VALUE && (
                  <input
                    value={newJourneyTitle}
                    onChange={(e) => setNewJourneyTitle(e.target.value)}
                    placeholder={t.newJourneyPlaceholder}
                    className="mt-2 w-full rounded-xl border-2 border-border bg-surface-muted px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
                  />
                )}
              </div>
            )}

            {error && <p className="text-danger text-sm text-center mb-4">{error}</p>}

            <div className="flex justify-center">
              <Button size="lg" onClick={handleSave} disabled={saving || !mode || compressing}>
                {saving ? "…" : t.saveBtn}
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function MemoryPalaceCreatePage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex justify-center py-20">
          <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
      }
    >
      <CreateContent />
    </Suspense>
  );
}
