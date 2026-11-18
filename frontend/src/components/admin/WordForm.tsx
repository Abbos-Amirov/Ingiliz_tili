"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Difficulty, ImageAttribution, IrregularVerb, PartOfSpeech, Word } from "@/lib/types";
import { apiFetch, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { AiAssistButton } from "./AiAssistPanel";
import { UnsplashImagePicker } from "./UnsplashImagePicker";
import { parseLessonRangeText, formatLessonRange } from "@/lib/lessonRange";
import { PARTS_OF_SPEECH } from "@/lib/partsOfSpeech";
import { tf, useAdminT } from "@/hooks/useAdminT";

interface WordFormValues {
  english: string;
  korean: string;
  uzbek: string;
  exampleSentenceEn: string;
  exampleSentenceKo: string;
  exampleSentenceUz: string;
  category: string;
  difficulty: Difficulty;
  partOfSpeech: PartOfSpeech | "";
  imageUrl: string | null;
  imageAttribution: ImageAttribution | null;
}

const emptyValues: WordFormValues = {
  english: "",
  korean: "",
  uzbek: "",
  exampleSentenceEn: "",
  exampleSentenceKo: "",
  exampleSentenceUz: "",
  category: "general",
  difficulty: "beginner",
  partOfSpeech: "",
  imageUrl: null,
  imageAttribution: null,
};

export function WordForm({ initial, onSaved }: { initial?: Word | null; onSaved: () => void }) {
  const router = useRouter();
  const [values, setValues] = useState<WordFormValues>(
    initial
      ? {
          english: initial.english,
          korean: initial.korean,
          uzbek: initial.uzbek,
          exampleSentenceEn: initial.exampleSentenceEn,
          exampleSentenceKo: initial.exampleSentenceKo,
          exampleSentenceUz: initial.exampleSentenceUz,
          category: initial.category,
          difficulty: initial.difficulty,
          partOfSpeech: initial.partOfSpeech ?? "",
          imageUrl: initial.imageUrl ?? null,
          imageAttribution: initial.imageAttribution ?? null,
        }
      : emptyValues,
  );
  const [lessonRangeText, setLessonRangeText] = useState(
    initial ? formatLessonRange(initial.lessonNumber, initial.lessonNumberEnd) : "1",
  );
  const [error, setError] = useState<string | null>(null);
  const [dupWarning, setDupWarning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [liveMatches, setLiveMatches] = useState<Word[]>([]);
  const [checkedEnglish, setCheckedEnglish] = useState("");
  const [checkingLive, setCheckingLive] = useState(false);
  const [irregularMatch, setIrregularMatch] = useState<IrregularVerb | null>(null);
  const [dismissIrregularWarning, setDismissIrregularWarning] = useState(false);
  const t = useAdminT("wordForm");
  const tf_ = useAdminT("form");
  const tc = useAdminT("common");
  const tl = useAdminT("levels");
  const tp = useAdminT("pos");

  useEffect(() => {
    const english = values.english.trim();
    const skip = !english || (initial != null && english.toLowerCase() === initial.english.toLowerCase());
    if (skip) return;
    // Debounced live-search loading flag against the separate Express API.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCheckingLive(true);
    const timeout = window.setTimeout(() => {
      apiFetch<{ words: Word[] }>(`/words?english=${encodeURIComponent(english)}`, { skipAuth: true })
        .then((res) => {
          setLiveMatches(res.words);
          setCheckedEnglish(english.toLowerCase());
        })
        .catch(() => setLiveMatches([]))
        .finally(() => setCheckingLive(false));
    }, 400);
    return () => window.clearTimeout(timeout);
  }, [values.english, initial]);

  const showLiveWarning =
    !checkingLive && liveMatches.length > 0 && checkedEnglish === values.english.trim().toLowerCase();

  useEffect(() => {
    const english = values.english.trim();
    if (!english) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIrregularMatch(null);
      return;
    }
    // Debounced irregular-verb duplicate check against the separate Express API.
    const timeout = window.setTimeout(() => {
      apiFetch<{ exists: boolean; verb?: IrregularVerb }>(
        `/irregular-verbs/check?word=${encodeURIComponent(english)}`,
        { admin: true },
      )
        .then((res) => setIrregularMatch(res.exists && res.verb ? res.verb : null))
        .catch(() => setIrregularMatch(null));
    }, 400);
    return () => window.clearTimeout(timeout);
  }, [values.english]);

  const showIrregularWarning = Boolean(irregularMatch) && !dismissIrregularWarning;

  useEffect(() => {
    if (initial) return;
    apiFetch<{ nextLessonNumber: number }>("/lessons/next-number", { admin: true })
      .then((res) => setLessonRangeText(String(res.nextLessonNumber)))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function update<K extends keyof WordFormValues>(key: K, value: WordFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setDupWarning(false);
    if (key === "english") setDismissIrregularWarning(false);
  }

  async function save(force = false) {
    const lessonRange = parseLessonRangeText(lessonRangeText);
    if (!lessonRange) {
      setError(tf_.lessonInvalid);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = { ...values, partOfSpeech: values.partOfSpeech || null, ...lessonRange };
      if (initial) {
        await apiFetch(`/words/${initial._id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
          admin: true,
        });
      } else {
        await apiFetch(`/words${force ? "?force=true" : ""}`, {
          method: "POST",
          body: JSON.stringify(payload),
          admin: true,
        });
      }
      onSaved();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setDupWarning(true);
      } else {
        setError(err instanceof ApiError ? err.message : tf_.saveErrorFull);
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
        <Field label={t.english}>
          <input
            required
            value={values.english}
            onChange={(e) => update("english", e.target.value)}
            className="input"
          />
        </Field>
        <Field label={t.korean}>
          <input
            required
            value={values.korean}
            onChange={(e) => update("korean", e.target.value)}
            className="input"
          />
        </Field>
        <Field label={t.uzbek}>
          <input
            required
            value={values.uzbek}
            onChange={(e) => update("uzbek", e.target.value)}
            className="input"
          />
        </Field>
      </div>

      {checkingLive && <p className="text-xs text-foreground/40 -mt-2">{tf_.checking}</p>}

      {showLiveWarning && (
        <div className="rounded-xl bg-accent-soft border border-accent/30 p-3 text-sm -mt-2">
          <p className="text-accent font-semibold">
            {tf(t.existsTitle, { word: values.english.trim() })}
          </p>
          <ul className="mt-1 space-y-0.5 text-accent/90">
            {liveMatches.map((w) => (
              <li key={w._id}>
                {w.english} — {w.korean} (
                {tf(tc.lesson, {
                  n: w.lessonNumber === w.lessonNumberEnd ? String(w.lessonNumber) : `${w.lessonNumber}-${w.lessonNumberEnd}`,
                })}
                )
              </li>
            ))}
          </ul>
        </div>
      )}

      {showIrregularWarning && irregularMatch && (
        <div className="rounded-xl bg-accent-soft border border-accent/30 p-3 text-sm -mt-2 space-y-2">
          <p className="text-accent font-semibold">
            {tf(t.irregularWarning, {
              word: values.english.trim(),
              forms: `${irregularMatch.base} → ${irregularMatch.past} → ${irregularMatch.participle}`,
            })}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={() => router.push("/admin/irregular-verbs")}>
              {t.goIrregular}
            </Button>
            <Button type="button" size="sm" variant="secondary" onClick={() => setDismissIrregularWarning(true)}>
              {t.addAsWord}
            </Button>
          </div>
        </div>
      )}

      <AiAssistButton
        english={values.english}
        onSuggestion={(s) =>
          setValues((prev) => ({
            ...prev,
            korean: s.korean,
            uzbek: s.uzbek,
            exampleSentenceEn: s.exampleSentenceEn,
            exampleSentenceKo: s.exampleSentenceKo,
            exampleSentenceUz: s.exampleSentenceUz,
            partOfSpeech: s.partOfSpeech,
          }))
        }
      />

      <UnsplashImagePicker
        defaultQuery={values.english}
        selectedImageUrl={values.imageUrl}
        onSelect={(imageUrl, imageAttribution) => setValues((prev) => ({ ...prev, imageUrl, imageAttribution }))}
        onClear={() => setValues((prev) => ({ ...prev, imageUrl: null, imageAttribution: null }))}
      />

      <Field label={t.exampleEn}>
        <input
          value={values.exampleSentenceEn}
          onChange={(e) => update("exampleSentenceEn", e.target.value)}
          className="input"
        />
      </Field>
      <Field label={t.exampleKo}>
        <input
          value={values.exampleSentenceKo}
          onChange={(e) => update("exampleSentenceKo", e.target.value)}
          className="input"
        />
      </Field>
      <Field label={t.exampleUz}>
        <input
          value={values.exampleSentenceUz}
          onChange={(e) => update("exampleSentenceUz", e.target.value)}
          className="input"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label={t.category}>
          <input
            value={values.category}
            onChange={(e) => update("category", e.target.value)}
            className="input"
            placeholder="motion-verbs, food..."
          />
        </Field>
        <Field label={tf_.level}>
          <select
            value={values.difficulty}
            onChange={(e) => update("difficulty", e.target.value as Difficulty)}
            className="input"
          >
            <option value="beginner">{tl.beginner}</option>
            <option value="intermediate">{tl.intermediate}</option>
            <option value="advanced">{tl.advanced}</option>
          </select>
        </Field>
      </div>

      <Field label={t.pos}>
        <select
          value={values.partOfSpeech}
          onChange={(e) => update("partOfSpeech", e.target.value as PartOfSpeech | "")}
          className="input"
        >
          <option value="">{tf_.notSelected}</option>
          {PARTS_OF_SPEECH.map((pos) => (
            <option key={pos} value={pos}>
              {tp[pos]}
            </option>
          ))}
        </select>
      </Field>

      <Field label={tf_.lessonLabel}>
        <input
          required
          value={lessonRangeText}
          onChange={(e) => setLessonRangeText(e.target.value)}
          placeholder={tf_.lessonPlaceholder}
          className="input"
        />
      </Field>

      {dupWarning && (
        <div className="rounded-xl bg-accent-soft border border-accent/30 p-3 text-sm">
          <p className="text-accent font-semibold mb-2">
            {t.duplicate}
          </p>
          <Button type="button" size="sm" variant="secondary" onClick={() => save(true)}>
            {tf_.addAnyway}
          </Button>
        </div>
      )}

      {error && <p className="text-danger text-sm">{error}</p>}

      <Button type="submit" className="w-full" disabled={saving}>
        {saving ? tc.saving : initial ? tf_.update : tf_.add}
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
