"use client";

import { useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import type { PartOfSpeech } from "@/lib/types";

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
