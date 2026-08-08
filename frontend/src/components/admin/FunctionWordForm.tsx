"use client";

import { FormEvent, useEffect, useState } from "react";
import type { FunctionWord, FunctionWordCategory, FunctionWordMistake, FunctionWordUsageType } from "@/lib/types";
import { apiFetch, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { AiFunctionWordAssistButton } from "./AiAssistPanel";

const CATEGORY_LABELS: Record<FunctionWordCategory, string> = {
  preposition: "Predlog",
  article: "Artikl",
  question_word: "So'roq so'zi",
  infinitive_marker: "Infinitive belgisi",
};

interface FormValues {
  word: string;
  category: FunctionWordCategory;
  korean: string;
  simpleExplanation: string;
  usageTypes: FunctionWordUsageType[];
  commonMistakes: FunctionWordMistake[];
  order: string;
}

const emptyValues: FormValues = {
  word: "",
  category: "preposition",
  korean: "",
  simpleExplanation: "",
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

  function applyAiSuggestion(s: { simpleExplanation: string; usageTypes: FunctionWordUsageType[]; commonMistakes: FunctionWordMistake[] }) {
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

      <label className="block">
        <span className="block text-sm font-medium mb-1.5">Oddiy tushuntirish</span>
        <textarea
          value={values.simpleExplanation}
          onChange={(e) => update("simpleExplanation", e.target.value)}
          className="w-full rounded-xl border border-border bg-surface-muted px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-primary min-h-20"
        />
      </label>

      <div className="rounded-xl border border-border p-4 space-y-3">
        <p className="text-xs font-bold uppercase tracking-wide text-foreground/50">Ishlatilish turlari</p>
        {values.usageTypes.map((ut, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                value={ut.meaning}
                onChange={(e) => update("usageTypes", values.usageTypes.map((x, j) => (j === i ? { ...x, meaning: e.target.value } : x)))}
                placeholder="Ma'no"
                className="input"
              />
              <input
                value={ut.example}
                onChange={(e) => update("usageTypes", values.usageTypes.map((x, j) => (j === i ? { ...x, example: e.target.value } : x)))}
                placeholder="Misol (en)"
                className="input"
              />
              <input
                value={ut.note}
                onChange={(e) => update("usageTypes", values.usageTypes.map((x, j) => (j === i ? { ...x, note: e.target.value } : x)))}
                placeholder="Izoh"
                className="input"
              />
            </div>
            <button
              type="button"
              onClick={() => update("usageTypes", values.usageTypes.filter((_, j) => j !== i))}
              className="shrink-0 text-danger text-lg leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-danger-soft"
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => update("usageTypes", [...values.usageTypes, { meaning: "", example: "", note: "" }])}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/15"
        >
          + Tur qo&apos;shish
        </button>
      </div>

      <div className="rounded-xl border border-border p-4 space-y-3">
        <p className="text-xs font-bold uppercase tracking-wide text-foreground/50">Tez-tez uchraydigan xatolar</p>
        {values.commonMistakes.map((cm, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                value={cm.wrong}
                onChange={(e) => update("commonMistakes", values.commonMistakes.map((x, j) => (j === i ? { ...x, wrong: e.target.value } : x)))}
                placeholder="✗ Noto'g'ri"
                className="input"
              />
              <input
                value={cm.correct}
                onChange={(e) => update("commonMistakes", values.commonMistakes.map((x, j) => (j === i ? { ...x, correct: e.target.value } : x)))}
                placeholder="✓ To'g'ri"
                className="input"
              />
              <input
                value={cm.explanation}
                onChange={(e) => update("commonMistakes", values.commonMistakes.map((x, j) => (j === i ? { ...x, explanation: e.target.value } : x)))}
                placeholder="Tushuntirish"
                className="input"
              />
            </div>
            <button
              type="button"
              onClick={() => update("commonMistakes", values.commonMistakes.filter((_, j) => j !== i))}
              className="shrink-0 text-danger text-lg leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-danger-soft"
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => update("commonMistakes", [...values.commonMistakes, { wrong: "", correct: "", explanation: "" }])}
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

      <style jsx>{`
        :global(.input) {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid var(--border);
          background: var(--surface-muted);
          padding: 0.6rem 0.9rem;
          outline: none;
          font-size: 0.875rem;
        }
        :global(.input:focus) {
          box-shadow: 0 0 0 2px var(--primary);
        }
      `}</style>
    </form>
  );
}
