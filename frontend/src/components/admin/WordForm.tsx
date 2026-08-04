"use client";

import { FormEvent, useEffect, useState } from "react";
import type { Difficulty, Word } from "@/lib/types";
import { apiFetch, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { AiAssistButton } from "./AiAssistPanel";

interface WordFormValues {
  english: string;
  korean: string;
  exampleSentenceEn: string;
  exampleSentenceKo: string;
  category: string;
  difficulty: Difficulty;
  lessonNumber: number;
}

const emptyValues: WordFormValues = {
  english: "",
  korean: "",
  exampleSentenceEn: "",
  exampleSentenceKo: "",
  category: "general",
  difficulty: "beginner",
  lessonNumber: 1,
};

export function WordForm({ initial, onSaved }: { initial?: Word | null; onSaved: () => void }) {
  const [values, setValues] = useState<WordFormValues>(
    initial
      ? {
          english: initial.english,
          korean: initial.korean,
          exampleSentenceEn: initial.exampleSentenceEn,
          exampleSentenceKo: initial.exampleSentenceKo,
          category: initial.category,
          difficulty: initial.difficulty,
          lessonNumber: initial.lessonNumber,
        }
      : emptyValues,
  );
  const [error, setError] = useState<string | null>(null);
  const [dupWarning, setDupWarning] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initial) return;
    apiFetch<{ nextLessonNumber: number }>("/lessons/next-number", { admin: true })
      .then((res) => setValues((prev) => ({ ...prev, lessonNumber: res.nextLessonNumber })))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function update<K extends keyof WordFormValues>(key: K, value: WordFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setDupWarning(false);
  }

  async function save(force = false) {
    setSaving(true);
    setError(null);
    try {
      if (initial) {
        await apiFetch(`/words/${initial._id}`, {
          method: "PUT",
          body: JSON.stringify(values),
          admin: true,
        });
      } else {
        await apiFetch(`/words${force ? "?force=true" : ""}`, {
          method: "POST",
          body: JSON.stringify(values),
          admin: true,
        });
      }
      onSaved();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setDupWarning(true);
      } else {
        setError(err instanceof ApiError ? err.message : "Saqlashda xatolik yuz berdi");
      }
    } finally {
      setSaving(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    save(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Ingliz so'z">
          <input
            required
            value={values.english}
            onChange={(e) => update("english", e.target.value)}
            className="input"
          />
        </Field>
        <Field label="Koreys so'z">
          <input
            required
            value={values.korean}
            onChange={(e) => update("korean", e.target.value)}
            className="input"
          />
        </Field>
      </div>

      <AiAssistButton
        english={values.english}
        onSuggestion={(s) =>
          setValues((prev) => ({
            ...prev,
            korean: s.korean,
            exampleSentenceEn: s.exampleSentenceEn,
            exampleSentenceKo: s.exampleSentenceKo,
          }))
        }
      />

      <Field label="Misol gap (ingliz)">
        <input
          value={values.exampleSentenceEn}
          onChange={(e) => update("exampleSentenceEn", e.target.value)}
          className="input"
        />
      </Field>
      <Field label="Misol gap (koreys)">
        <input
          value={values.exampleSentenceKo}
          onChange={(e) => update("exampleSentenceKo", e.target.value)}
          className="input"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Kategoriya">
          <input
            value={values.category}
            onChange={(e) => update("category", e.target.value)}
            className="input"
            placeholder="motion-verbs, food..."
          />
        </Field>
        <Field label="Daraja">
          <select
            value={values.difficulty}
            onChange={(e) => update("difficulty", e.target.value as Difficulty)}
            className="input"
          >
            <option value="beginner">Boshlang&apos;ich</option>
            <option value="intermediate">O&apos;rta</option>
            <option value="advanced">Murakkab</option>
          </select>
        </Field>
      </div>

      <Field label="Dars raqami">
        <input
          type="number"
          min={1}
          required
          value={values.lessonNumber}
          onChange={(e) => update("lessonNumber", Number(e.target.value))}
          className="input"
        />
      </Field>

      {dupWarning && (
        <div className="rounded-xl bg-accent-soft border border-accent/30 p-3 text-sm">
          <p className="text-accent font-semibold mb-2">
            Bu so&apos;z juftligi (english+korean) allaqachon mavjud.
          </p>
          <Button type="button" size="sm" variant="secondary" onClick={() => save(true)}>
            Baribir qo&apos;shish
          </Button>
        </div>
      )}

      {error && <p className="text-danger text-sm">{error}</p>}

      <Button type="submit" className="w-full" disabled={saving}>
        {saving ? "Saqlanmoqda..." : initial ? "Yangilash" : "Qo'shish"}
      </Button>

      <style jsx>{`
        :global(.input) {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid var(--border);
          background: var(--surface-muted);
          padding: 0.6rem 0.9rem;
          outline: none;
        }
        :global(.input:focus) {
          box-shadow: 0 0 0 2px var(--primary);
        }
      `}</style>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium mb-1.5">{label}</span>
      {children}
    </label>
  );
}
