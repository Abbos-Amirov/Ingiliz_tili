"use client";

import { FormEvent, useEffect, useState } from "react";
import type { Difficulty, Sentence } from "@/lib/types";
import { apiFetch, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/Button";

export function SentenceForm({
  initial,
  onSaved,
}: {
  initial?: Sentence | null;
  onSaved: () => void;
}) {
  const [korean, setKorean] = useState(initial?.korean ?? "");
  const [englishText, setEnglishText] = useState(initial?.englishWords.join(" ") ?? "");
  const [englishWords, setEnglishWords] = useState<string[]>(initial?.englishWords ?? []);
  const [distractorText, setDistractorText] = useState("");
  const [distractorWords, setDistractorWords] = useState<string[]>(initial?.distractorWords ?? []);
  const [level, setLevel] = useState<Difficulty>(initial?.level ?? "beginner");
  const [lessonNumber, setLessonNumber] = useState<number>(initial?.lessonNumber ?? 1);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initial) return;
    apiFetch<{ nextLessonNumber: number }>("/lessons/next-number", { admin: true })
      .then((res) => setLessonNumber(res.nextLessonNumber))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function splitEnglish() {
    const words = englishText.trim().split(/\s+/).filter(Boolean);
    setEnglishWords(words);
  }

  function addDistractor() {
    const words = distractorText.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return;
    setDistractorWords((prev) => [...prev, ...words]);
    setDistractorText("");
  }

  function removeWord(list: "english" | "distractor", index: number) {
    if (list === "english") setEnglishWords((prev) => prev.filter((_, i) => i !== index));
    else setDistractorWords((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (englishWords.length === 0) {
      setError("Avval ingliz gapni so'zlarga bo'ling");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = { korean, englishWords, distractorWords, level, lessonNumber };
      if (initial) {
        await apiFetch(`/sentences/${initial._id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
          admin: true,
        });
      } else {
        await apiFetch("/sentences", {
          method: "POST",
          body: JSON.stringify(payload),
          admin: true,
        });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Saqlashda xatolik yuz berdi");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="block text-sm font-medium mb-1.5">Koreys gap</span>
        <input
          required
          value={korean}
          onChange={(e) => setKorean(e.target.value)}
          className="w-full rounded-xl border border-border bg-surface-muted px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-primary"
        />
      </label>

      <label className="block">
        <span className="block text-sm font-medium mb-1.5">To&apos;g&apos;ri ingliz gap</span>
        <div className="flex gap-2">
          <input
            value={englishText}
            onChange={(e) => setEnglishText(e.target.value)}
            placeholder="I am going home"
            className="flex-1 rounded-xl border border-border bg-surface-muted px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-primary"
          />
          <Button type="button" size="sm" variant="secondary" onClick={splitEnglish}>
            So&apos;zlarga bo&apos;lish
          </Button>
        </div>
      </label>

      {englishWords.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {englishWords.map((w, i) => (
            <button
              key={`${w}-${i}`}
              type="button"
              onClick={() => removeWord("english", i)}
              className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-semibold"
              title="O'chirish uchun bosing"
            >
              {w} ×
            </button>
          ))}
        </div>
      )}

      <label className="block">
        <span className="block text-sm font-medium mb-1.5">Chalg&apos;ituvchi so&apos;zlar (ixtiyoriy)</span>
        <div className="flex gap-2">
          <input
            value={distractorText}
            onChange={(e) => setDistractorText(e.target.value)}
            placeholder="goes running"
            className="flex-1 rounded-xl border border-border bg-surface-muted px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-primary"
          />
          <Button type="button" size="sm" variant="secondary" onClick={addDistractor}>
            Qo&apos;shish
          </Button>
        </div>
      </label>

      {distractorWords.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {distractorWords.map((w, i) => (
            <button
              key={`${w}-${i}`}
              type="button"
              onClick={() => removeWord("distractor", i)}
              className="px-3 py-1.5 rounded-lg bg-danger-soft text-danger text-sm font-semibold"
              title="O'chirish uchun bosing"
            >
              {w} ×
            </button>
          ))}
        </div>
      )}

      <label className="block">
        <span className="block text-sm font-medium mb-1.5">Daraja</span>
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value as Difficulty)}
          className="w-full rounded-xl border border-border bg-surface-muted px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="beginner">Boshlang&apos;ich</option>
          <option value="intermediate">O&apos;rta</option>
          <option value="advanced">Murakkab</option>
        </select>
      </label>

      <label className="block">
        <span className="block text-sm font-medium mb-1.5">Dars raqami</span>
        <input
          type="number"
          min={1}
          required
          value={lessonNumber}
          onChange={(e) => setLessonNumber(Number(e.target.value))}
          className="w-full rounded-xl border border-border bg-surface-muted px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-primary"
        />
      </label>

      {error && <p className="text-danger text-sm">{error}</p>}

      <Button type="submit" className="w-full" disabled={saving}>
        {saving ? "Saqlanmoqda..." : initial ? "Yangilash" : "Qo'shish"}
      </Button>
    </form>
  );
}
