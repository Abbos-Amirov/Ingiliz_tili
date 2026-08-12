"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useT } from "@/hooks/useT";
import { useMemoryPalace } from "@/hooks/useMemoryPalace";
import { apiFetch } from "@/lib/api";
import { compressImage } from "@/lib/imageCompression";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SuggestedPhotoPicker } from "@/components/memoryPalace/SuggestedPhotoPicker";
import { RoomScroller } from "@/components/memoryPalace/RoomScroller";
import { PALACE_ROOM_BY_KEY, PALACE_ROOMS } from "@/lib/palaceRooms";
import type { ImageAttribution, MemoryJourney, PalaceRoomKey, RoomAssignedBy, Word } from "@/lib/types";

const NEW_JOURNEY_VALUE = "__new__";
const NONE_JOURNEY_VALUE = "";
const WORDS_PER_PAGE = 15;

function CreateContent() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useT("memoryPalace");
  const { fetchAnchors, fetchJourneys, createJourney, createAnchor, suggestRoom } = useMemoryPalace();
  const rooms = useT("palaceRooms");

  const presetJourneyId = searchParams.get("journeyId") ?? "";
  const presetRoomParam = searchParams.get("roomKey");
  const presetRoomKey = PALACE_ROOMS.some((r) => r.key === presetRoomParam) ? (presetRoomParam as PalaceRoomKey) : null;

  const [words, setWords] = useState<Word[] | null>(null);
  const [anchoredWordIds, setAnchoredWordIds] = useState<Set<string>>(new Set());
  const [journeys, setJourneys] = useState<MemoryJourney[] | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedWord, setSelectedWord] = useState<Word | null>(null);

  const [mode, setMode] = useState<"image" | "suggested" | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [suggestedImage, setSuggestedImage] = useState<{ url: string; attribution: ImageAttribution } | null>(null);
  const [textDescription, setTextDescription] = useState("");

  const [journeySelection, setJourneySelection] = useState<string>(presetJourneyId || NONE_JOURNEY_VALUE);
  const [newJourneyTitle, setNewJourneyTitle] = useState("");

  const [aiSuggestedRoom, setAiSuggestedRoom] = useState<PalaceRoomKey | null>(null);
  const [suggestingRoom, setSuggestingRoom] = useState(false);
  const [roomKey, setRoomKey] = useState<PalaceRoomKey | null>(presetRoomKey);
  const [roomAssignedBy, setRoomAssignedBy] = useState<RoomAssignedBy | null>(presetRoomKey ? "user" : null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedSignal, setSavedSignal] = useState(0);

  useEffect(() => {
    if (!ready || !user) return;
    // The whole project's word list (same /words endpoint the "Umumiy
    // so'zlar" page uses), not just words the SRS has already surfaced —
    // so every word in the app is placeable here, not only "learned" ones.
    apiFetch<{ words: Word[] }>("/words?limit=500").then((res) => setWords(res.words));
    fetchAnchors().then((res) => setAnchoredWordIds(new Set(res.anchors.map((a) => a.wordId._id))));
    fetchJourneys().then((res) => setJourneys(res.journeys));
  }, [ready, user, fetchAnchors, fetchJourneys]);

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  useEffect(() => {
    if (!selectedWord) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSuggestingRoom(true);
    setAiSuggestedRoom(null);
    suggestRoom(selectedWord._id)
      .then((res) => setAiSuggestedRoom(res.roomKey))
      .catch(() => setAiSuggestedRoom(null))
      .finally(() => setSuggestingRoom(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWord]);

  const filteredWords = useMemo(() => {
    if (!words) return [];
    const q = search.trim().toLowerCase();
    if (!q) return words;
    return words.filter((w) => w.english.toLowerCase().includes(q) || w.korean.includes(q));
  }, [words, search]);

  const totalPages = Math.max(1, Math.ceil(filteredWords.length / WORDS_PER_PAGE));
  const pagedWords = useMemo(
    () => filteredWords.slice((page - 1) * WORDS_PER_PAGE, page * WORDS_PER_PAGE),
    [filteredWords, page],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1);
  }, [search]);

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
    setSuggestedImage(null);
    setTextDescription("");
    setSearch("");
    setPage(1);
    setAiSuggestedRoom(null);
    // Keep the room preset from ?roomKey= (e.g. arriving via a room's "add
    // word" button) across consecutive saves, so placing several words into
    // the same room doesn't require re-picking it each time.
    setRoomKey(presetRoomKey);
    setRoomAssignedBy(presetRoomKey ? "user" : null);
  }

  async function handleSave() {
    if (!selectedWord) return;
    const pickedImageUrl = mode === "suggested" ? suggestedImage?.url : imageBase64;
    if (!pickedImageUrl && !textDescription.trim()) {
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
        imageUrl: pickedImageUrl ?? undefined,
        imageAttribution: mode === "suggested" ? suggestedImage?.attribution : undefined,
        textDescription: textDescription.trim() || undefined,
        journeyId,
        journeyOrder,
        roomKey: roomKey ?? undefined,
        roomAssignedBy: roomKey ? (roomAssignedBy ?? undefined) : undefined,
      });

      setSavedSignal((s) => s + 1);
      // The word stays in the (now full project-wide) list — just flag it
      // as placed so its card shows the "already placed" badge instead of
      // disappearing, since re-placing a word is a supported edit, not an error.
      setAnchoredWordIds((prev) => new Set(prev).add(selectedWord._id));
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
        <Link href="/memory-palace" className="inline-block mb-4 text-sm font-medium text-foreground/50 hover:text-primary">
          {t.backToHub}
        </Link>
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

                {filteredWords.length === 0 ? (
                  <p className="text-sm text-foreground/50 text-center py-6">{t.noWordResults}</p>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      {pagedWords.map((w) => (
                        <button
                          key={w._id}
                          type="button"
                          onClick={() => setSelectedWord(w)}
                          className="relative px-3 py-2.5 rounded-xl border-2 border-border bg-surface text-left hover:border-primary/40 transition-colors"
                        >
                          {anchoredWordIds.has(w._id) && (
                            <span className="absolute top-1.5 right-1.5 text-success text-xs" title={t.alreadyPlacedHint}>
                              ✓
                            </span>
                          )}
                          <p className="font-semibold text-sm pr-4">{w.english}</p>
                          <p className="text-xs text-foreground/50">{w.korean}</p>
                        </button>
                      ))}
                    </div>

                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-1.5 mt-4 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={page === 1}
                          className="h-8 w-8 rounded-lg text-sm font-semibold text-foreground/60 hover:bg-surface-muted disabled:opacity-30"
                        >
                          ←
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setPage(p)}
                            className={`h-8 w-8 rounded-lg text-sm font-semibold transition-colors ${
                              p === page ? "gradient-primary text-white" : "text-foreground/60 hover:bg-surface-muted"
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                          disabled={page === totalPages}
                          className="h-8 w-8 rounded-lg text-sm font-semibold text-foreground/60 hover:bg-surface-muted disabled:opacity-30"
                        >
                          →
                        </button>
                      </div>
                    )}
                  </>
                )}
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

            <div className="flex justify-center gap-2 mb-5 flex-wrap">
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
                onClick={() => setMode("suggested")}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                  mode === "suggested" ? "gradient-primary text-white" : "bg-surface-muted text-foreground/70"
                }`}
              >
                {t.suggestedBtn}
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

            {mode === "suggested" && (
              <SuggestedPhotoPicker
                defaultQuery={selectedWord.english}
                selectedImageUrl={suggestedImage?.url}
                onSelect={(imageUrl, attribution) => setSuggestedImage({ url: imageUrl, attribution })}
                onClear={() => setSuggestedImage(null)}
              />
            )}

            <div className="mb-5">
              <p className="text-xs font-semibold text-foreground/50 mb-2">{t.descriptionLabel}</p>
              <textarea
                value={textDescription}
                onChange={(e) => setTextDescription(e.target.value)}
                placeholder={t.descriptionPlaceholder}
                rows={2}
                className="w-full rounded-xl border-2 border-border bg-surface-muted px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>

            {journeys !== null && (
              <div className="mb-6">
                <p className="text-xs font-semibold text-foreground/50 mb-2">{t.journeyLabel}</p>
                <select
                  value={journeySelection}
                  onChange={(e) => {
                    setJourneySelection(e.target.value);
                    if (e.target.value !== NEW_JOURNEY_VALUE) setNewJourneyTitle("");
                  }}
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
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-foreground/50 mb-2">{t.newJourneyThemesLabel}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {t.journeyThemeSuggestions.map((theme) => (
                        <button
                          key={theme}
                          type="button"
                          onClick={() => setNewJourneyTitle(theme)}
                          className={`px-3 py-2 rounded-xl border-2 text-sm font-medium text-left transition-colors ${
                            newJourneyTitle === theme
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-surface text-foreground/70 hover:border-primary/40"
                          }`}
                        >
                          {theme}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mb-6">
              <p className="text-xs font-semibold text-foreground/50 mb-2">{t.chooseRoomLabel}</p>

              {suggestingRoom && <p className="text-xs text-foreground/40 mb-2">{t.aiSuggestingRoom}</p>}

              {aiSuggestedRoom && roomKey !== aiSuggestedRoom && (
                <div
                  className="flex items-center gap-3 rounded-xl border-2 p-3 mb-3"
                  style={{ borderColor: PALACE_ROOM_BY_KEY[aiSuggestedRoom].text, backgroundColor: PALACE_ROOM_BY_KEY[aiSuggestedRoom].bg }}
                >
                  <span className="text-2xl">{PALACE_ROOM_BY_KEY[aiSuggestedRoom].emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold" style={{ color: PALACE_ROOM_BY_KEY[aiSuggestedRoom].text }}>
                      {t.aiSuggestedRoomPrefix} {rooms[aiSuggestedRoom].name} {t.aiSuggestedRoomFits}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setRoomKey(aiSuggestedRoom);
                      setRoomAssignedBy("ai");
                    }}
                    className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg bg-white/70 hover:bg-white transition-colors"
                    style={{ color: PALACE_ROOM_BY_KEY[aiSuggestedRoom].text }}
                  >
                    {t.acceptRoomSuggestionBtn}
                  </button>
                </div>
              )}

              <RoomScroller
                selectedKey={roomKey}
                onSelect={(key) => {
                  setRoomKey(key);
                  setRoomAssignedBy(key ? "user" : null);
                }}
                noneLabel={t.noRoomBtn}
              />
            </div>

            {error && <p className="text-danger text-sm text-center mb-4">{error}</p>}

            <div className="flex justify-center">
              <Button size="lg" onClick={handleSave} disabled={saving || compressing}>
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
