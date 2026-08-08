"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Difficulty, ImageAttribution, IrregularVerb, PartOfSpeech, Word } from "@/lib/types";
import { apiFetch, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { AiAssistButton } from "./AiAssistPanel";
import { UnsplashImagePicker } from "./UnsplashImagePicker";
import { parseLessonRangeText, formatLessonRange } from "@/lib/lessonRange";
import { PARTS_OF_SPEECH, PARTS_OF_SPEECH_LABELS } from "@/lib/partsOfSpeech";

interface WordFormValues {
  english: string;
  korean: string;
  exampleSentenceEn: string;
  exampleSentenceKo: string;
  category: string;
  difficulty: Difficulty;
  partOfSpeech: PartOfSpeech | "";
  imageUrl: string | null;
  imageAttribution: ImageAttribution | null;
}

const emptyValues: WordFormValues = {
  english: "",
  korean: "",
  exampleSentenceEn: "",
  exampleSentenceKo: "",
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
          exampleSentenceEn: initial.exampleSentenceEn,
          exampleSentenceKo: initial.exampleSentenceKo,
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
      setError("Dars raqami noto'g'ri. Masalan: 7 yoki 34-37");
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

      {checkingLive && <p className="text-xs text-foreground/40 -mt-2">Tekshirilmoqda...</p>}

      {showLiveWarning && (
        <div className="rounded-xl bg-accent-soft border border-accent/30 p-3 text-sm -mt-2">
          <p className="text-accent font-semibold">
            &quot;{values.english.trim()}&quot; so&apos;zi bazada allaqachon mavjud:
          </p>
          <ul className="mt-1 space-y-0.5 text-accent/90">
            {liveMatches.map((w) => (
              <li key={w._id}>
                {w.english} — {w.korean} ({w.lessonNumber === w.lessonNumberEnd ? `${w.lessonNumber}-dars` : `${w.lessonNumber}-${w.lessonNumberEnd}-dars`})
              </li>
            ))}
          </ul>
        </div>
      )}

      {showIrregularWarning && irregularMatch && (
        <div className="rounded-xl bg-accent-soft border border-accent/30 p-3 text-sm -mt-2 space-y-2">
          <p className="text-accent font-semibold">
            ⚠️ &quot;{values.english.trim()}&quot; — bu irregular verb ({irregularMatch.base} → {irregularMatch.past} →{" "}
            {irregularMatch.participle}). Bu so&apos;z allaqachon Irregular Verbs bazasida mavjud.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={() => router.push("/admin/irregular-verbs")}>
              Irregular Verbs bo&apos;limiga o&apos;t
            </Button>
            <Button type="button" size="sm" variant="secondary" onClick={() => setDismissIrregularWarning(true)}>
              Baribir oddiy so&apos;z sifatida qo&apos;sh
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
            exampleSentenceEn: s.exampleSentenceEn,
            exampleSentenceKo: s.exampleSentenceKo,
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

      <Field label="So'z turkumi (grammatik)">
        <select
          value={values.partOfSpeech}
          onChange={(e) => update("partOfSpeech", e.target.value as PartOfSpeech | "")}
          className="input"
        >
          <option value="">— tanlanmagan —</option>
          {PARTS_OF_SPEECH.map((pos) => (
            <option key={pos} value={pos}>
              {PARTS_OF_SPEECH_LABELS[pos]}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Dars raqami (masalan: 7 yoki 34-37)">
        <input
          required
          value={lessonRangeText}
          onChange={(e) => setLessonRangeText(e.target.value)}
          placeholder="7 yoki 34-37"
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
