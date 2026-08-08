"use client";

import { useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import type {
  Difficulty,
  FunctionWordCategory,
  FunctionWordMistake,
  FunctionWordUsageType,
  GrammarCommonMistake,
  GrammarExample,
  GrammarUsageCase,
  IrregularVerbCategory,
  PartOfSpeech,
  RoleWord,
  SentenceWordExplanation,
  Trilingual,
} from "@/lib/types";

interface Suggestion {
  korean: string;
  exampleSentenceEn: string;
  exampleSentenceKo: string;
  partOfSpeech: PartOfSpeech;
}

export function AiAssistButton({
  english,
  onSuggestion,
}: {
  english: string;
  onSuggestion: (s: Suggestion) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (!english.trim()) {
      setError("Avval inglizcha so'zni kiriting");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await apiFetch<{ suggestion: Suggestion }>("/admin/ai-assist/translate", {
        method: "POST",
        body: JSON.stringify({ english: english.trim() }),
        admin: true,
      });
      onSuggestion(res.suggestion);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "AI xizmatida xatolik");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-accent-soft text-accent hover:brightness-95 disabled:opacity-60"
      >
        {loading ? "AI o'ylayapti..." : "✨ AI bilan taklif olish"}
      </button>
      {error && <p className="text-xs text-danger mt-1">{error}</p>}
    </div>
  );
}

interface GrammarTopicSuggestion {
  titleTranslations: { en: string; ko: string };
  ruleExplanation: { uz: string; en: string; ko: string };
  usageCases: GrammarUsageCase[];
  commonMistakes: GrammarCommonMistake[];
  examples: GrammarExample[];
}

export function AiGrammarAssistButton({
  title,
  formula,
  level,
  onSuggestion,
}: {
  title: string;
  formula: string;
  level: Difficulty;
  onSuggestion: (s: GrammarTopicSuggestion) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (!title.trim() || !formula.trim()) {
      setError("Avval Nomi va Formula maydonlarini kiriting");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await apiFetch<{ suggestion: GrammarTopicSuggestion }>("/grammar-topics/ai-generate", {
        method: "POST",
        body: JSON.stringify({ title: title.trim(), formula: formula.trim(), level }),
        admin: true,
      });
      onSuggestion(res.suggestion);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "AI xizmatida xatolik");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-accent-soft text-accent hover:brightness-95 disabled:opacity-60"
      >
        {loading ? "AI o'ylayapti..." : "✨ AI bilan avtomatik yozish"}
      </button>
      {error && <p className="text-xs text-danger mt-1">{error}</p>}
    </div>
  );
}

interface SentenceExplanationSuggestion {
  wordBreakdown: SentenceWordExplanation[];
  generalRule: Trilingual;
  practiceExamples: string[];
}

export function AiDeepExplanationAssistButton({
  korean,
  words,
  formula,
  onSuggestion,
}: {
  korean: string;
  words: RoleWord[];
  formula: string;
  onSuggestion: (s: SentenceExplanationSuggestion) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (!korean.trim() || words.length === 0) {
      setError("Avval koreys gap va so'zlarni kiriting");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await apiFetch<{ suggestion: SentenceExplanationSuggestion }>("/sentences/ai-generate-explanation", {
        method: "POST",
        body: JSON.stringify({ korean: korean.trim(), words, formula }),
        admin: true,
      });
      onSuggestion(res.suggestion);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "AI xizmatida xatolik");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-accent-soft text-accent hover:brightness-95 disabled:opacity-60"
      >
        {loading ? "AI o'ylayapti..." : "✨ AI bilan chuqur tushuntirish yaratish"}
      </button>
      {error && <p className="text-xs text-danger mt-1">{error}</p>}
    </div>
  );
}

interface FunctionWordSuggestion {
  simpleExplanation: Trilingual;
  usageTypes: FunctionWordUsageType[];
  commonMistakes: FunctionWordMistake[];
}

export function AiFunctionWordAssistButton({
  word,
  category,
  onSuggestion,
}: {
  word: string;
  category: FunctionWordCategory;
  onSuggestion: (s: FunctionWordSuggestion) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (!word.trim()) {
      setError("Avval so'zni kiriting");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await apiFetch<{ suggestion: FunctionWordSuggestion }>("/function-words/ai-generate", {
        method: "POST",
        body: JSON.stringify({ word: word.trim(), category }),
        admin: true,
      });
      onSuggestion(res.suggestion);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "AI xizmatida xatolik");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-accent-soft text-accent hover:brightness-95 disabled:opacity-60"
      >
        {loading ? "AI o'ylayapti..." : "✨ AI bilan to'ldirish"}
      </button>
      {error && <p className="text-xs text-danger mt-1">{error}</p>}
    </div>
  );
}

interface IrregularVerbSuggestion {
  past: string;
  participle: string;
  korean: string;
  category: IrregularVerbCategory;
}

export function AiIrregularVerbAssistButton({
  base,
  onSuggestion,
}: {
  base: string;
  onSuggestion: (s: IrregularVerbSuggestion) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (!base.trim()) {
      setError("Avval Base (V1) so'zini kiriting");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await apiFetch<{ suggestion: IrregularVerbSuggestion }>("/admin/ai-assist/irregular-verb", {
        method: "POST",
        body: JSON.stringify({ base: base.trim() }),
        admin: true,
      });
      onSuggestion(res.suggestion);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "AI xizmatida xatolik");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-accent-soft text-accent hover:brightness-95 disabled:opacity-60"
      >
        {loading ? "AI o'ylayapti..." : "✨ AI bilan to'ldirish"}
      </button>
      {error && <p className="text-xs text-danger mt-1">{error}</p>}
    </div>
  );
}
