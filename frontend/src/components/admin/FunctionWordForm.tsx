"use client";

import { FormEvent, useEffect, useState } from "react";
import type { FunctionWord, FunctionWordCategory, FunctionWordMistake, FunctionWordUsageType, Trilingual } from "@/lib/types";
import { apiFetch, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { AiFunctionWordAssistButton } from "./AiAssistPanel";
import { TrilingualInput, TrilingualTextarea } from "./TrilingualField";

const CATEGORY_LABELS: Record<FunctionWordCategory, string> = {
  preposition: "Predlog",
  article: "Artikl",
  question_word: "So'roq so'zi",
  infinitive_marker: "Infinitive belgisi",
};

const emptyTrilingual: Trilingual = { uz: "", en: "", ko: "" };

interface FormValues {
  word: string;
  category: FunctionWordCategory;
  korean: string;
  simpleExplanation: Trilingual;
  usageTypes: FunctionWordUsageType[];
  commonMistakes: FunctionWordMistake[];
  order: string;
}

const emptyValues: FormValues = {
  word: "",
  category: "preposition",
  korean: "",
  simpleExplanation: emptyTrilingual,
  usageTypes: [],
  commonMistakes: [],
  order: "0",
};

function fromWord(w: FunctionWord): FormValues {
  return {
    word: w.word,
    category: w.category,
    korean: w.korean,
    simpleExplanation: w.simpleExplanation,
    usageTypes: w.usageTypes,
    commonMistakes: w.commonMistakes,
    order: String(w.order),
  };
}

export function FunctionWordForm({
  initial,
  onSaved,
}: {
  initial?: FunctionWord | null;
  onSaved: () => void;
}) {
  const [values, setValues] = useState<FormValues>(initial ? fromWord(initial) : emptyValues);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValues(initial ? fromWord(initial) : emptyValues);
  }, [initial]);

  function update<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function applyAiSuggestion(s: { simpleExplanation: Trilingual; usageTypes: FunctionWordUsageType[]; commonMistakes: FunctionWordMistake[] }) {
    setValues((prev) => ({
      ...prev,
      simpleExplanation: s.simpleExplanation,
      usageTypes: s.usageTypes,
      commonMistakes: s.commonMistakes,
    }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = { ...values, order: Number(values.order) || 0 };
      if (initial) {
        await apiFetch(`/function-words/${initial._id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
          admin: true,
        });
      } else {
        await apiFetch("/function-words", {
          method: "POST",
          body: JSON.stringify(payload),
          admin: true,
        });
      }
      onSaved();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError("Bu so'z allaqachon mavjud.");
      } else {
        setError(err instanceof ApiError ? err.message : "Saqlashda xatolik yuz berdi");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="block text-sm font-medium mb-1.5">So&apos;z</span>
          <input
            required
            value={values.word}
            onChange={(e) => update("word", e.target.value)}
            placeholder="to"
            className="w-full rounded-xl border border-border bg-surface-muted px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-primary"
          />
        </label>
        <label className="block">
          <span className="block text-sm font-medium mb-1.5">Kategoriya</span>
          <select
            value={values.category}
            onChange={(e) => update("category", e.target.value as FunctionWordCategory)}
            className="w-full rounded-xl border border-border bg-surface-muted px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-primary"
          >
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className="block text-sm font-medium mb-1.5">Koreys tarjimasi</span>
        <input
          value={values.korean}
          onChange={(e) => update("korean", e.target.value)}
          className="w-full rounded-xl border border-border bg-surface-muted px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-primary"
        />
      </label>

      <AiFunctionWordAssistButton word={values.word} category={values.category} onSuggestion={applyAiSuggestion} />

      <div>
        <span className="block text-sm font-medium mb-1.5">Oddiy tushuntirish (uz / en / ko)</span>
        <TrilingualTextarea value={values.simpleExplanation} onChange={(v) => update("simpleExplanation", v)} />
      </div>

      <div className="rounded-xl border border-border p-4 space-y-3">
        <p className="text-xs font-bold uppercase tracking-wide text-foreground/50">Ishlatilish turlari</p>
        {values.usageTypes.map((ut, i) => (
          <div key={i} className="rounded-lg border border-border p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground/50">Tur #{i + 1}</span>
              <button
                type="button"
                onClick={() => update("usageTypes", values.usageTypes.filter((_, j) => j !== i))}
                className="shrink-0 text-danger text-lg leading-none w-7 h-7 flex items-center justify-center rounded-full hover:bg-danger-soft"
              >
                ×
              </button>
            </div>
            <div>
              <span className="block text-xs font-medium mb-1">Ma&apos;no</span>
              <TrilingualInput
                value={ut.meaning}
                onChange={(v) => update("usageTypes", values.usageTypes.map((x, j) => (j === i ? { ...x, meaning: v } : x)))}
              />
            </div>
            <div>
              <span className="block text-xs font-medium mb-1">Misol (en)</span>
              <input
                value={ut.example}
                onChange={(e) => update("usageTypes", values.usageTypes.map((x, j) => (j === i ? { ...x, example: e.target.value } : x)))}
                className="w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <span className="block text-xs font-medium mb-1">Izoh</span>
              <TrilingualInput
                value={ut.note}
                onChange={(v) => update("usageTypes", values.usageTypes.map((x, j) => (j === i ? { ...x, note: v } : x)))}
              />
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            update("usageTypes", [...values.usageTypes, { meaning: emptyTrilingual, example: "", note: emptyTrilingual }])
          }
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/15"
        >
          + Tur qo&apos;shish
        </button>
      </div>

      <div className="rounded-xl border border-border p-4 space-y-3">
        <p className="text-xs font-bold uppercase tracking-wide text-foreground/50">Tez-tez uchraydigan xatolar</p>
        {values.commonMistakes.map((cm, i) => (
          <div key={i} className="rounded-lg border border-border p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground/50">Xato #{i + 1}</span>
              <button
                type="button"
                onClick={() => update("commonMistakes", values.commonMistakes.filter((_, j) => j !== i))}
                className="shrink-0 text-danger text-lg leading-none w-7 h-7 flex items-center justify-center rounded-full hover:bg-danger-soft"
              >
                ×
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                value={cm.wrong}
                onChange={(e) => update("commonMistakes", values.commonMistakes.map((x, j) => (j === i ? { ...x, wrong: e.target.value } : x)))}
                placeholder="✗ Noto'g'ri (en)"
                className="rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                value={cm.correct}
                onChange={(e) => update("commonMistakes", values.commonMistakes.map((x, j) => (j === i ? { ...x, correct: e.target.value } : x)))}
                placeholder="✓ To'g'ri (en)"
                className="rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <span className="block text-xs font-medium mb-1">Tushuntirish</span>
              <TrilingualInput
                value={cm.explanation}
                onChange={(v) => update("commonMistakes", values.commonMistakes.map((x, j) => (j === i ? { ...x, explanation: v } : x)))}
              />
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            update("commonMistakes", [...values.commonMistakes, { wrong: "", correct: "", explanation: emptyTrilingual }])
          }
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/15"
        >
          + Xato qo&apos;shish
        </button>
      </div>

      <label className="block">
        <span className="block text-sm font-medium mb-1.5">Tartib raqami</span>
        <input
          type="number"
          value={values.order}
          onChange={(e) => update("order", e.target.value)}
          className="w-full max-w-[8rem] rounded-xl border border-border bg-surface-muted px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-primary"
        />
      </label>

      {error && <p className="text-danger text-sm">{error}</p>}

      <Button type="submit" className="w-full" disabled={saving}>
        {saving ? "Saqlanmoqda..." : initial ? "Yangilash" : "Qo'shish"}
      </Button>
    </form>
  );
}
