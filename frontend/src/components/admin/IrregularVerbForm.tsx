"use client";

import { tf, useAdminT } from "@/hooks/useAdminT";
import { FormEvent, useEffect, useState } from "react";
import type { IrregularVerb, IrregularVerbCategory } from "@/lib/types";
import { apiFetch, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { AiIrregularVerbAssistButton } from "./AiAssistPanel";
import { IRREGULAR_VERB_CATEGORIES } from "@/lib/irregularVerbCategories";

interface FormValues {
  base: string;
  past: string;
  participle: string;
  korean: string;
  uzbek: string;
  category: IrregularVerbCategory;
  frequency: string;
}

const emptyValues: FormValues = {
  base: "",
  past: "",
  participle: "",
  korean: "",
  uzbek: "",
  category: "other",
  frequency: "",
};

export function IrregularVerbForm({
  initial,
  onSaved,
}: {
  initial?: IrregularVerb | null;
  onSaved: () => void;
}) {
  const [values, setValues] = useState<FormValues>(
    initial
      ? {
          base: initial.base,
          past: initial.past,
          participle: initial.participle,
          korean: initial.korean,
          uzbek: initial.uzbek,
          category: initial.category,
          frequency: initial.frequency != null ? String(initial.frequency) : "",
        }
      : emptyValues,
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dupMatch, setDupMatch] = useState<IrregularVerb | null>(null);
  const [checking, setChecking] = useState(false);
  const t = useAdminT("irregularForm");
  const tfm = useAdminT("form");
  const tc = useAdminT("common");
  const ti = useAdminT("irregular");

  useEffect(() => {
    const base = values.base.trim();
    const skip = !base || (initial != null && base.toLowerCase() === initial.base.toLowerCase());
    if (skip) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDupMatch(null);
      return;
    }
    setChecking(true);
    const timeout = window.setTimeout(() => {
      apiFetch<{ exists: boolean; verb?: IrregularVerb }>(
        `/irregular-verbs/check?word=${encodeURIComponent(base)}`,
        { admin: true },
      )
        .then((res) => setDupMatch(res.exists && res.verb ? res.verb : null))
        .catch(() => setDupMatch(null))
        .finally(() => setChecking(false));
    }, 400);
    return () => window.clearTimeout(timeout);
  }, [values.base, initial]);

  function update<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (dupMatch) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        base: values.base.trim(),
        past: values.past.trim(),
        participle: values.participle.trim(),
        korean: values.korean.trim(),
        uzbek: values.uzbek.trim(),
        category: values.category,
        frequency: values.frequency.trim() === "" ? null : Number(values.frequency),
      };
      if (initial) {
        await apiFetch(`/irregular-verbs/${initial._id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
          admin: true,
        });
      } else {
        await apiFetch("/irregular-verbs", {
          method: "POST",
          body: JSON.stringify(payload),
          admin: true,
        });
      }
      onSaved();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError(t.duplicate);
      } else {
        setError(err instanceof ApiError ? err.message : tfm.saveErrorFull);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Field label="Base (V1)">
          <input required value={values.base} onChange={(e) => update("base", e.target.value)} className="input" />
        </Field>
        <Field label="Past (V2)">
          <input required value={values.past} onChange={(e) => update("past", e.target.value)} className="input" />
        </Field>
        <Field label="Participle (V3)">
          <input
            required
            value={values.participle}
            onChange={(e) => update("participle", e.target.value)}
            className="input"
          />
        </Field>
      </div>

      {checking && <p className="text-xs text-foreground/40 -mt-2">{tfm.checking}</p>}

      {dupMatch && (
        <div className="rounded-xl bg-danger-soft border border-danger/30 p-3 text-sm -mt-2">
          <p className="text-danger font-semibold">
            {tf(t.duplicateWith, { forms: `${dupMatch.base} — ${dupMatch.past} — ${dupMatch.participle}` })}
          </p>
        </div>
      )}

      <AiIrregularVerbAssistButton
        base={values.base}
        onSuggestion={(s) =>
          setValues((prev) => ({
            ...prev,
            past: s.past,
            participle: s.participle,
            korean: s.korean,
            uzbek: s.uzbek,
            category: s.category,
          }))
        }
      />

      <div className="grid grid-cols-2 gap-3">
        <Field label={t.korean}>
          <input required value={values.korean} onChange={(e) => update("korean", e.target.value)} className="input" />
        </Field>
        <Field label={t.uzbek}>
          <input required value={values.uzbek} onChange={(e) => update("uzbek", e.target.value)} className="input" />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label={t.category}>
          <select
            value={values.category}
            onChange={(e) => update("category", e.target.value as IrregularVerbCategory)}
            className="input"
          >
            {IRREGULAR_VERB_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {ti[`cat_${c}`]}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label={t.frequency}>
        <input
          type="number"
          min="1"
          value={values.frequency}
          onChange={(e) => update("frequency", e.target.value)}
          className="input"
        />
      </Field>

      {error && <p className="text-danger text-sm">{error}</p>}

      <Button type="submit" className="w-full" disabled={saving || Boolean(dupMatch)}>
        {saving ? tc.saving : initial ? tfm.update : tfm.add}
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
