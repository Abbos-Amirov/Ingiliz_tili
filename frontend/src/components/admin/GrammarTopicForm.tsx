"use client";

import { FormEvent, useEffect, useState } from "react";
import type {
  Difficulty,
  GrammarCommonMistake,
  GrammarExample,
  GrammarRelatedFormula,
  GrammarTopic,
  GrammarUsageCase,
} from "@/lib/types";
import { apiFetch, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { AiGrammarAssistButton } from "./AiAssistPanel";
import { useLevelsConfig } from "@/hooks/useLevelsConfig";

interface FormValues {
  title: { uz: string; en: string; ko: string };
  formula: string;
  level: Difficulty;
  order: string;
  ruleExplanation: { uz: string; en: string; ko: string };
  usageCases: GrammarUsageCase[];
  relatedFormulas: GrammarRelatedFormula[];
  commonMistakes: GrammarCommonMistake[];
  examples: GrammarExample[];
}

const emptyValues: FormValues = {
  title: { uz: "", en: "", ko: "" },
  formula: "",
  level: "beginner",
  order: "0",
  ruleExplanation: { uz: "", en: "", ko: "" },
  usageCases: [],
  relatedFormulas: [],
  commonMistakes: [],
  examples: [],
};

function fromTopic(t: GrammarTopic): FormValues {
  return {
    title: t.title,
    formula: t.formula,
    level: t.level,
    order: String(t.order),
    ruleExplanation: t.ruleExplanation,
    usageCases: t.usageCases,
    relatedFormulas: t.relatedFormulas,
    commonMistakes: t.commonMistakes,
    examples: t.examples,
  };
}

export function GrammarTopicForm({
  initial,
  allTopics,
  onSaved,
}: {
  initial?: GrammarTopic | null;
  allTopics: GrammarTopic[];
  onSaved: () => void;
}) {
  const levelsConfig = useLevelsConfig();
  const [values, setValues] = useState<FormValues>(initial ? fromTopic(initial) : emptyValues);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Reset the form when the modal is reused for a different topic (no remount).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValues(initial ? fromTopic(initial) : emptyValues);
  }, [initial]);

  function update<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function applyAiSuggestion(s: {
    titleTranslations: { en: string; ko: string };
    ruleExplanation: { uz: string; en: string; ko: string };
    usageCases: GrammarUsageCase[];
    commonMistakes: GrammarCommonMistake[];
    examples: GrammarExample[];
  }) {
    setValues((prev) => ({
      ...prev,
      title: { ...prev.title, en: s.titleTranslations.en, ko: s.titleTranslations.ko },
      ruleExplanation: s.ruleExplanation,
      usageCases: s.usageCases,
      commonMistakes: s.commonMistakes,
      examples: s.examples,
    }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = { ...values, order: Number(values.order) || 0 };
      if (initial) {
        await apiFetch(`/grammar-topics/${initial._id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
          admin: true,
        });
      } else {
        await apiFetch("/grammar-topics", {
          method: "POST",
          body: JSON.stringify(payload),
          admin: true,
        });
      }
      onSaved();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError("Bu nomdagi grammatika mavzusi allaqachon mavjud.");
      } else {
        setError(err instanceof ApiError ? err.message : "Saqlashda xatolik yuz berdi");
      }
    } finally {
      setSaving(false);
    }
  }

  const formulaPresets = levelsConfig?.[values.level]?.formulas ?? [];
  const otherTopics = allTopics.filter((t) => t._id !== initial?._id);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Field label="Daraja">
        <select
          value={values.level}
          onChange={(e) => update("level", e.target.value as Difficulty)}
          className="input max-w-xs"
        >
          <option value="beginner">Boshlang&apos;ich</option>
          <option value="intermediate">O&apos;rta</option>
          <option value="advanced">Murakkab</option>
        </select>
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Field label="Nomi (o'zbekcha)">
          <input
            required
            value={values.title.uz}
            onChange={(e) => update("title", { ...values.title, uz: e.target.value })}
            className="input"
          />
        </Field>
        <Field label="Nomi (inglizcha)">
          <input
            required
            value={values.title.en}
            onChange={(e) => update("title", { ...values.title, en: e.target.value })}
            className="input"
          />
        </Field>
        <Field label="Nomi (koreyscha)">
          <input
            required
            value={values.title.ko}
            onChange={(e) => update("title", { ...values.title, ko: e.target.value })}
            className="input"
          />
        </Field>
      </div>

      <Field label="Formula">
        <div className="flex gap-2">
          <input
            required
            value={values.formula}
            onChange={(e) => update("formula", e.target.value)}
            placeholder="S+be+V-ing"
            className="input font-mono"
          />
          {formulaPresets.length > 0 && (
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) update("formula", e.target.value);
              }}
              className="input max-w-[9rem]"
            >
              <option value="">Tayyor...</option>
              {formulaPresets.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          )}
        </div>
      </Field>

      <Field label="Tartib raqami (shu daraja ichida)">
        <input
          type="number"
          value={values.order}
          onChange={(e) => update("order", e.target.value)}
          className="input max-w-[8rem]"
        />
      </Field>

      <AiGrammarAssistButton
        title={values.title.uz}
        formula={values.formula}
        level={values.level}
        onSuggestion={applyAiSuggestion}
      />

      <Section title="Qoida tushuntirish">
        <Field label="O'zbekcha">
          <textarea
            value={values.ruleExplanation.uz}
            onChange={(e) => update("ruleExplanation", { ...values.ruleExplanation, uz: e.target.value })}
            className="input min-h-20"
          />
        </Field>
        <Field label="Inglizcha">
          <textarea
            value={values.ruleExplanation.en}
            onChange={(e) => update("ruleExplanation", { ...values.ruleExplanation, en: e.target.value })}
            className="input min-h-20"
          />
        </Field>
        <Field label="Koreyscha">
          <textarea
            value={values.ruleExplanation.ko}
            onChange={(e) => update("ruleExplanation", { ...values.ruleExplanation, ko: e.target.value })}
            className="input min-h-20"
          />
        </Field>
      </Section>

      <Section title="Ishlatilish holatlari">
        {values.usageCases.map((uc, i) => (
          <ArrayRow key={i} onRemove={() => update("usageCases", values.usageCases.filter((_, j) => j !== i))}>
            <input
              value={uc.uz}
              onChange={(e) =>
                update(
                  "usageCases",
                  values.usageCases.map((x, j) => (j === i ? { ...x, uz: e.target.value } : x)),
                )
              }
              placeholder="Tavsif (uz)"
              className="input"
            />
            <input
              value={uc.example}
              onChange={(e) =>
                update(
                  "usageCases",
                  values.usageCases.map((x, j) => (j === i ? { ...x, example: e.target.value } : x)),
                )
              }
              placeholder="Misol (en)"
              className="input"
            />
          </ArrayRow>
        ))}
        <AddButton onClick={() => update("usageCases", [...values.usageCases, { uz: "", example: "" }])}>
          + Holat qo&apos;shish
        </AddButton>
      </Section>

      <Section title="Bog'liq grammatikalar">
        {values.relatedFormulas.map((rf, i) => (
          <ArrayRow
            key={i}
            onRemove={() => update("relatedFormulas", values.relatedFormulas.filter((_, j) => j !== i))}
          >
            <select
              value={rf.relatedTopicId}
              onChange={(e) => {
                const chosen = otherTopics.find((t) => t._id === e.target.value);
                update(
                  "relatedFormulas",
                  values.relatedFormulas.map((x, j) =>
                    j === i ? { ...x, relatedTopicId: e.target.value, title: chosen?.title.uz ?? x.title } : x,
                  ),
                );
              }}
              className="input"
            >
              <option value="">— mavzu tanlang —</option>
              {otherTopics.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.title.uz}
                </option>
              ))}
            </select>
            <input
              value={rf.difference}
              onChange={(e) =>
                update(
                  "relatedFormulas",
                  values.relatedFormulas.map((x, j) => (j === i ? { ...x, difference: e.target.value } : x)),
                )
              }
              placeholder="Farqi (uz)"
              className="input"
            />
          </ArrayRow>
        ))}
        <AddButton
          onClick={() =>
            update("relatedFormulas", [...values.relatedFormulas, { relatedTopicId: "", title: "", difference: "" }])
          }
        >
          + Bog&apos;liq mavzu qo&apos;shish
        </AddButton>
      </Section>

      <Section title="Tez-tez uchraydigan xatolar">
        {values.commonMistakes.map((cm, i) => (
          <ArrayRow
            key={i}
            onRemove={() => update("commonMistakes", values.commonMistakes.filter((_, j) => j !== i))}
          >
            <input
              value={cm.wrong}
              onChange={(e) =>
                update(
                  "commonMistakes",
                  values.commonMistakes.map((x, j) => (j === i ? { ...x, wrong: e.target.value } : x)),
                )
              }
              placeholder="✗ Noto'g'ri"
              className="input"
            />
            <input
              value={cm.correct}
              onChange={(e) =>
                update(
                  "commonMistakes",
                  values.commonMistakes.map((x, j) => (j === i ? { ...x, correct: e.target.value } : x)),
                )
              }
              placeholder="✓ To'g'ri"
              className="input"
            />
            <input
              value={cm.explanation}
              onChange={(e) =>
                update(
                  "commonMistakes",
                  values.commonMistakes.map((x, j) => (j === i ? { ...x, explanation: e.target.value } : x)),
                )
              }
              placeholder="Tushuntirish"
              className="input"
            />
          </ArrayRow>
        ))}
        <AddButton
          onClick={() =>
            update("commonMistakes", [...values.commonMistakes, { wrong: "", correct: "", explanation: "" }])
          }
        >
          + Xato qo&apos;shish
        </AddButton>
      </Section>

      <Section title="Misollar">
        {values.examples.map((ex, i) => (
          <ArrayRow key={i} onRemove={() => update("examples", values.examples.filter((_, j) => j !== i))}>
            <input
              value={ex.english}
              onChange={(e) =>
                update(
                  "examples",
                  values.examples.map((x, j) => (j === i ? { ...x, english: e.target.value } : x)),
                )
              }
              placeholder="English"
              className="input"
            />
            <input
              value={ex.korean}
              onChange={(e) =>
                update("examples", values.examples.map((x, j) => (j === i ? { ...x, korean: e.target.value } : x)))
              }
              placeholder="한국어"
              className="input"
            />
            <input
              value={ex.uzbek}
              onChange={(e) =>
                update("examples", values.examples.map((x, j) => (j === i ? { ...x, uzbek: e.target.value } : x)))
              }
              placeholder="O'zbekcha"
              className="input"
            />
          </ArrayRow>
        ))}
        <AddButton onClick={() => update("examples", [...values.examples, { english: "", korean: "", uzbek: "" }])}>
          + Misol qo&apos;shish
        </AddButton>
      </Section>

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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium mb-1.5">{label}</span>
      {children}
    </label>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border p-4 space-y-3">
      <p className="text-xs font-bold uppercase tracking-wide text-foreground/50">{title}</p>
      {children}
    </div>
  );
}

function ArrayRow({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">{children}</div>
      <button
        type="button"
        onClick={onRemove}
        className="shrink-0 text-danger text-lg leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-danger-soft"
        title="O'chirish"
      >
        ×
      </button>
    </div>
  );
}

function AddButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/15"
    >
      {children}
    </button>
  );
}
