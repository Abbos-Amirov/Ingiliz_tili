"use client";

import { FormEvent, useEffect, useState } from "react";
import type { Difficulty, Sentence, RoleWord, GrammarRole } from "@/lib/types";
import { apiFetch, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { parseLessonRangeText, formatLessonRange } from "@/lib/lessonRange";
import { ROLE_COLORS, GRAMMAR_ROLES } from "@/lib/roleColors";
import { useLevelsConfig } from "@/hooks/useLevelsConfig";

function splitToRoleWords(text: string, defaultRole: GrammarRole): RoleWord[] {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => ({ text: word, role: defaultRole }));
}

function RoleWordChips({
  words,
  variant,
  onRoleChange,
  onRemove,
}: {
  words: RoleWord[];
  variant: "correct" | "distractor";
  onRoleChange: (index: number, role: GrammarRole) => void;
  onRemove: (index: number) => void;
}) {
  if (words.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {words.map((w, i) => {
        const color = ROLE_COLORS[w.role];
        return (
          <div
            key={`${w.text}-${i}`}
            className="flex items-center gap-1.5 rounded-lg border-2 pl-2.5 pr-1 py-1"
            style={{ backgroundColor: color.bg, borderColor: `${color.text}30` }}
          >
            <span className="text-sm font-semibold" style={{ color: color.text }}>
              {w.text}
            </span>
            <select
              value={w.role}
              onChange={(e) => onRoleChange(i, e.target.value as GrammarRole)}
              className="text-xs bg-transparent outline-none cursor-pointer"
              style={{ color: color.text }}
            >
              {GRAMMAR_ROLES.map((role) => (
                <option key={role} value={role}>
                  {ROLE_COLORS[role].label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => onRemove(i)}
              className="text-sm leading-none px-1 opacity-60 hover:opacity-100"
              style={{ color: color.text }}
              title="O'chirish"
            >
              ×
            </button>
          </div>
        );
      })}
      <span className="sr-only">{variant}</span>
    </div>
  );
}

export function SentenceForm({
  initial,
  onSaved,
}: {
  initial?: Sentence | null;
  onSaved: () => void;
}) {
  const levelsConfig = useLevelsConfig();
  const [korean, setKorean] = useState(initial?.korean ?? "");
  const [englishText, setEnglishText] = useState(initial?.words.map((w) => w.text).join(" ") ?? "");
  const [words, setWords] = useState<RoleWord[]>(initial?.words ?? []);
  const [distractorText, setDistractorText] = useState("");
  const [distractorWords, setDistractorWords] = useState<RoleWord[]>(initial?.distractorWords ?? []);
  const [formula, setFormula] = useState(initial?.formula ?? "");
  const [level, setLevel] = useState<Difficulty>(initial?.level ?? "beginner");
  const [lessonRangeText, setLessonRangeText] = useState(
    initial ? formatLessonRange(initial.lessonNumber, initial.lessonNumberEnd) : "1",
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (initial) return;
    apiFetch<{ nextLessonNumber: number }>("/lessons/next-number", { admin: true })
      .then((res) => setLessonRangeText(String(res.nextLessonNumber)))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function splitEnglish() {
    setWords(splitToRoleWords(englishText, "verb"));
  }

  function addDistractor() {
    const newWords = splitToRoleWords(distractorText, "verb");
    if (newWords.length === 0) return;
    setDistractorWords((prev) => [...prev, ...newWords]);
    setDistractorText("");
  }

  function updateWordRole(index: number, role: GrammarRole) {
    setWords((prev) => prev.map((w, i) => (i === index ? { ...w, role } : w)));
  }

  function updateDistractorRole(index: number, role: GrammarRole) {
    setDistractorWords((prev) => prev.map((w, i) => (i === index ? { ...w, role } : w)));
  }

  function removeWord(index: number) {
    setWords((prev) => prev.filter((_, i) => i !== index));
  }

  function removeDistractor(index: number) {
    setDistractorWords((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleAiAssist() {
    if (!englishText.trim() || !korean.trim()) {
      setError("AI ishlashi uchun avval koreys va ingliz gapni kiriting");
      return;
    }
    setAiLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{
        suggestion: { words: RoleWord[]; distractorWords: RoleWord[]; formula: string };
      }>("/admin/ai-assist/sentence-roles", {
        method: "POST",
        body: JSON.stringify({ english: englishText.trim(), korean: korean.trim() }),
        admin: true,
      });
      setWords(res.suggestion.words);
      setDistractorWords(res.suggestion.distractorWords);
      setFormula(res.suggestion.formula);
      setEnglishText(res.suggestion.words.map((w) => w.text).join(" "));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "AI xizmatida xatolik yuz berdi");
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (words.length === 0) {
      setError("Avval ingliz gapni so'zlarga bo'ling yoki AI yordamidan foydalaning");
      return;
    }
    const lessonRange = parseLessonRangeText(lessonRangeText);
    if (!lessonRange) {
      setError("Dars raqami noto'g'ri. Masalan: 7 yoki 34-37");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = { korean, words, distractorWords, formula, level, ...lessonRange };
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

  const formulaPresets = levelsConfig?.[level]?.formulas ?? [];

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

      <Button type="button" size="sm" onClick={handleAiAssist} disabled={aiLoading} className="!bg-accent-soft !text-accent shadow-none">
        {aiLoading ? "AI o'ylayapti..." : "✨ AI bilan avtomatik ajratish"}
      </Button>

      {words.length > 0 && (
        <div>
          <span className="block text-xs font-medium text-foreground/50 mb-1.5">
            Har so&apos;zning grammatik rolini tekshiring/o&apos;zgartiring:
          </span>
          <RoleWordChips words={words} variant="correct" onRoleChange={updateWordRole} onRemove={removeWord} />
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

      <RoleWordChips
        words={distractorWords}
        variant="distractor"
        onRoleChange={updateDistractorRole}
        onRemove={removeDistractor}
      />

      <label className="block">
        <span className="block text-sm font-medium mb-1.5">Formula</span>
        <div className="flex gap-2">
          <input
            value={formula}
            onChange={(e) => setFormula(e.target.value)}
            placeholder="S+be+V-ing+O"
            className="flex-1 rounded-xl border border-border bg-surface-muted px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
          />
          {formulaPresets.length > 0 && (
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) setFormula(e.target.value);
              }}
              className="rounded-xl border border-border bg-surface-muted px-2 outline-none focus:ring-2 focus:ring-primary text-sm max-w-[9rem]"
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
      </label>

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
        <span className="block text-sm font-medium mb-1.5">Dars raqami (masalan: 7 yoki 34-37)</span>
        <input
          required
          value={lessonRangeText}
          onChange={(e) => setLessonRangeText(e.target.value)}
          placeholder="7 yoki 34-37"
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
