"use client";

import { FormEvent, useState } from "react";
import type { Difficulty, QuestionAnswerPair, QuestionCategory, RoleWord, GrammarRole } from "@/lib/types";
import { apiFetch, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { AiQuestionAnswerAssistButton } from "./AiAssistPanel";
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
  onRoleChange,
  onRemove,
}: {
  words: RoleWord[];
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
    </div>
  );
}

interface SentenceHalf {
  korean: string;
  englishText: string;
  words: RoleWord[];
  formula: string;
}

const emptyHalf: SentenceHalf = { korean: "", englishText: "", words: [], formula: "" };

function toHalf(korean: string, words: RoleWord[], formula: string): SentenceHalf {
  return { korean, englishText: words.map((w) => w.text).join(" "), words, formula };
}

function SentenceHalfFields({
  title,
  value,
  onChange,
}: {
  title: string;
  value: SentenceHalf;
  onChange: (v: SentenceHalf) => void;
}) {
  function splitEnglish() {
    onChange({ ...value, words: splitToRoleWords(value.englishText, "verb") });
  }

  return (
    <div className="rounded-xl border border-border p-4 space-y-3">
      <p className="text-xs font-bold uppercase tracking-wide text-foreground/50">{title}</p>
      <label className="block">
        <span className="block text-sm font-medium mb-1.5">Koreys</span>
        <input
          required
          value={value.korean}
          onChange={(e) => onChange({ ...value, korean: e.target.value })}
          className="w-full rounded-xl border border-border bg-surface-muted px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-primary"
        />
      </label>
      <label className="block">
        <span className="block text-sm font-medium mb-1.5">Ingliz</span>
        <div className="flex gap-2">
          <input
            value={value.englishText}
            onChange={(e) => onChange({ ...value, englishText: e.target.value })}
            className="flex-1 rounded-xl border border-border bg-surface-muted px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-primary"
          />
          <Button type="button" size="sm" variant="secondary" onClick={splitEnglish}>
            So&apos;zlarga bo&apos;lish
          </Button>
        </div>
      </label>
      {value.words.length > 0 && (
        <RoleWordChips
          words={value.words}
          onRoleChange={(i, role) => onChange({ ...value, words: value.words.map((w, j) => (j === i ? { ...w, role } : w)) })}
          onRemove={(i) => onChange({ ...value, words: value.words.filter((_, j) => j !== i) })}
        />
      )}
      <label className="block">
        <span className="block text-sm font-medium mb-1.5">Formula</span>
        <input
          value={value.formula}
          onChange={(e) => onChange({ ...value, formula: e.target.value })}
          placeholder="S+V+O"
          className="w-full rounded-xl border border-border bg-surface-muted px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
        />
      </label>
    </div>
  );
}

export function QuestionAnswerForm({
  initial,
  onSaved,
}: {
  initial?: QuestionAnswerPair | null;
  onSaved: () => void;
}) {
  const levelsConfig = useLevelsConfig();
  const [level, setLevel] = useState<Difficulty>(initial?.question.level ?? "beginner");
  const [subLevel, setSubLevel] = useState<1 | 2 | 3>(initial?.question.subLevel ?? 2);
  const [questionCategory, setQuestionCategory] = useState<QuestionCategory>(initial?.question.questionCategory ?? "yes_no");
  const [question, setQuestion] = useState<SentenceHalf>(
    initial ? toHalf(initial.question.korean, initial.question.words, initial.question.formula) : emptyHalf,
  );
  const [answer, setAnswer] = useState<SentenceHalf>(
    initial ? toHalf(initial.answer.korean, initial.answer.words, initial.answer.formula) : emptyHalf,
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function applyAiSuggestion(s: {
    question: { words: RoleWord[]; formula: string };
    answer: { words: RoleWord[]; formula: string };
    questionCategory: QuestionCategory | null;
  }) {
    setQuestion((prev) => ({ ...prev, words: s.question.words, formula: s.question.formula, englishText: s.question.words.map((w) => w.text).join(" ") }));
    setAnswer((prev) => ({ ...prev, words: s.answer.words, formula: s.answer.formula, englishText: s.answer.words.map((w) => w.text).join(" ") }));
    if (s.questionCategory) setQuestionCategory(s.questionCategory);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (question.words.length === 0 || answer.words.length === 0) {
      setError("Savol va javob so'zlarga bo'lingan bo'lishi kerak (yoki AI yordamidan foydalaning)");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        level,
        subLevel,
        questionCategory,
        question: { korean: question.korean, words: question.words, formula: question.formula },
        answer: { korean: answer.korean, words: answer.words, formula: answer.formula },
      };
      if (initial) {
        await apiFetch(`/question-answers/${initial.question._id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
          admin: true,
        });
      } else {
        await apiFetch("/question-answers", {
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
  void formulaPresets;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
          <span className="block text-sm font-medium mb-1.5">Ichki bosqich</span>
          <select
            value={subLevel}
            onChange={(e) => setSubLevel(Number(e.target.value) as 1 | 2 | 3)}
            className="w-full rounded-xl border border-border bg-surface-muted px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-primary"
          >
            <option value={2}>Bosqich 2 (Yes/No savollar)</option>
            <option value={3}>Bosqich 3 (Wh- savollar)</option>
          </select>
        </label>
        <label className="block">
          <span className="block text-sm font-medium mb-1.5">Savol turi</span>
          <select
            value={questionCategory}
            onChange={(e) => setQuestionCategory(e.target.value as QuestionCategory)}
            className="w-full rounded-xl border border-border bg-surface-muted px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="yes_no">Ha/Yo&apos;q savoli</option>
            <option value="wh_question">Wh- savol</option>
          </select>
        </label>
      </div>

      <SentenceHalfFields title="SAVOL" value={question} onChange={setQuestion} />
      <SentenceHalfFields title="JAVOB" value={answer} onChange={setAnswer} />

      <AiQuestionAnswerAssistButton
        questionEnglish={question.englishText}
        questionKorean={question.korean}
        answerEnglish={answer.englishText}
        answerKorean={answer.korean}
        onSuggestion={applyAiSuggestion}
      />

      {error && <p className="text-danger text-sm">{error}</p>}

      <Button type="submit" className="w-full" disabled={saving}>
        {saving ? "Saqlanmoqda..." : initial ? "Yangilash" : "Juftlikni saqlash"}
      </Button>
    </form>
  );
}
