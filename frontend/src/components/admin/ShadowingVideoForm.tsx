"use client";

import { useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { TranscriptWord, Difficulty, ShadowingVideo } from "@/lib/types";

const LEVELS: Difficulty[] = ["beginner", "intermediate", "advanced"];

export function ShadowingVideoForm({ initial, onSaved }: { initial?: ShadowingVideo | null; onSaved: () => void }) {
  const isEditing = !!initial;
  const [title, setTitle] = useState(initial?.title ?? "");
  const [level, setLevel] = useState<Difficulty>(initial?.level ?? "beginner");
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(initial?.videoUrl ?? null);
  const [filename, setFilename] = useState<string | null>(null);
  const [duration, setDuration] = useState(initial?.duration ?? 0);
  const [words, setWords] = useState<TranscriptWord[]>(initial?.transcript ?? []);
  const [uploading, setUploading] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetVideo(f: File | null) {
    setFile(f);
    setVideoUrl(null);
    setFilename(null);
    setWords([]);
    setError(null);
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("video", file);
      const res = await apiFetch<{ videoUrl: string; filename: string }>("/shadowing/upload", {
        method: "POST",
        body: form,
        admin: true,
      });
      setVideoUrl(res.videoUrl);
      setFilename(res.filename);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Video yuklashda xatolik");
    } finally {
      setUploading(false);
    }
  }

  async function handleTranscribe() {
    if (!filename) return;
    setTranscribing(true);
    setError(null);
    try {
      const res = await apiFetch<{ words: TranscriptWord[] }>("/shadowing/transcribe", {
        method: "POST",
        body: JSON.stringify({ filename }),
        admin: true,
      });
      setWords(res.words);
    } catch (err) {
      // A video over 25MB can't go through AI transcription (see
      // transcription.service.ts) — the editable table below still lets an
      // admin type the transcript by hand as a fallback.
      setError(err instanceof ApiError ? err.message : "Transkripsiyada xatolik. So'zlarni qo'lda kiriting.");
    } finally {
      setTranscribing(false);
    }
  }

  function updateWord(i: number, field: keyof TranscriptWord, value: string) {
    setWords((prev) =>
      prev.map((w, idx) => (idx === i ? { ...w, [field]: field === "word" ? value : Number(value) || 0 } : w)),
    );
  }

  function removeWord(i: number) {
    setWords((prev) => prev.filter((_, idx) => idx !== i));
  }

  function addWord() {
    const last = words[words.length - 1];
    setWords((prev) => [
      ...prev,
      { word: "", startTime: last ? last.endTime : 0, endTime: last ? last.endTime + 0.5 : 0.5 },
    ]);
  }

  async function handleSave() {
    if (!videoUrl || !title.trim() || words.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      const payload = { title: title.trim(), level, videoUrl, duration, transcript: words };
      if (isEditing) {
        await apiFetch(`/shadowing/${initial!._id}`, { method: "PUT", body: JSON.stringify(payload), admin: true });
      } else {
        await apiFetch("/shadowing", { method: "POST", body: JSON.stringify(payload), admin: true });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Saqlashda xatolik");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <Card className="p-6 space-y-4">
        <label className="block">
          <span className="block text-sm font-medium mb-1.5">Sarlavha</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="masalan: Kung Fu Panda - Secret Ingredient"
            className="w-full rounded-xl border border-border bg-surface-muted px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-primary"
          />
        </label>

        <div>
          <span className="block text-sm font-medium mb-1.5">Daraja</span>
          <div className="flex gap-2">
            {LEVELS.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLevel(l)}
                className={`px-3.5 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                  level === l ? "gradient-primary text-white" : "bg-surface-muted text-foreground/70"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {!isEditing && (
          <div>
            <input
              type="file"
              accept="video/*"
              onChange={(e) => resetVideo(e.target.files?.[0] ?? null)}
              className="block w-full text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-primary/10 file:text-primary file:px-4 file:py-2 file:font-semibold"
            />
            {file && !videoUrl && (
              <Button onClick={handleUpload} disabled={uploading} className="mt-3">
                {uploading ? "Yuklanmoqda..." : "Videoni yuklash"}
              </Button>
            )}
          </div>
        )}

        {videoUrl && (
          <div className="space-y-3">
            <video
              src={videoUrl}
              controls
              className="w-full rounded-xl max-h-72 bg-black"
              onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
            />
            {words.length === 0 && (
              <Button onClick={handleTranscribe} disabled={transcribing}>
                {transcribing ? "Transkripsiya qilinmoqda..." : "🤖 AI bilan transkripsiya qilish"}
              </Button>
            )}
          </div>
        )}
      </Card>

      {error && <p className="text-danger text-sm">{error}</p>}

      {videoUrl && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-foreground/60">
              Transkripsiya {words.length > 0 && `(${words.length} so'z)`} — so&apos;zlarni va vaqtlarni (soniyada)
              tahrirlashingiz mumkin
            </p>
            <button onClick={addWord} type="button" className="text-primary text-sm font-medium hover:underline shrink-0 ml-3">
              + So&apos;z qo&apos;shish
            </button>
          </div>
          {words.length === 0 ? (
            <p className="text-sm text-foreground/40 py-4 text-center">
              Hali so&apos;z yo&apos;q — AI transkripsiyasini kuting yoki qo&apos;lda qo&apos;shing.
            </p>
          ) : (
            <div className="max-h-96 overflow-y-auto space-y-1.5">
              {words.map((w, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={w.word}
                    onChange={(e) => updateWord(i, "word", e.target.value)}
                    className="flex-1 rounded-lg border border-border bg-surface-muted px-2.5 py-1.5 text-sm"
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={w.startTime}
                    onChange={(e) => updateWord(i, "startTime", e.target.value)}
                    className="w-24 rounded-lg border border-border bg-surface-muted px-2.5 py-1.5 text-sm"
                  />
                  <span className="text-foreground/30">→</span>
                  <input
                    type="number"
                    step="0.01"
                    value={w.endTime}
                    onChange={(e) => updateWord(i, "endTime", e.target.value)}
                    className="w-24 rounded-lg border border-border bg-surface-muted px-2.5 py-1.5 text-sm"
                  />
                  <button onClick={() => removeWord(i)} type="button" className="text-danger text-xs px-2 shrink-0">
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {videoUrl && words.length > 0 && (
        <Button onClick={handleSave} disabled={saving || !title.trim()}>
          {saving ? "Saqlanmoqda..." : "Saqlash"}
        </Button>
      )}
    </div>
  );
}
