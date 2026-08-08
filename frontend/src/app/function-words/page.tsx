"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useT, useLocale } from "@/hooks/useT";
import { apiFetch } from "@/lib/api";
import { playAudio } from "@/lib/tts";
import type { FunctionWord, FunctionWordCategory } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { FunctionWordModal } from "@/components/functionWords/FunctionWordModal";

const CATEGORY_ORDER: FunctionWordCategory[] = ["preposition", "article", "question_word", "infinitive_marker"];

export default function FunctionWordsPage() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const t = useT("functionWords");
  const { locale } = useLocale();

  const [words, setWords] = useState<FunctionWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<FunctionWord | null>(null);

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  useEffect(() => {
    if (!user) return;
    apiFetch<{ functionWords: FunctionWord[] }>("/function-words")
      .then((res) => setWords(res.functionWords))
      .finally(() => setLoading(false));
  }, [user]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return words;
    return words.filter(
      (w) => w.word.toLowerCase().includes(q) || w.korean.includes(q) || w.simpleExplanation[locale].toLowerCase().includes(q),
    );
  }, [words, query, locale]);

  const grouped = useMemo(() => {
    const map = new Map<FunctionWordCategory, FunctionWord[]>();
    for (const w of filtered) {
      const list = map.get(w.category) ?? [];
      list.push(w);
      map.set(w.category, list);
    }
    return CATEGORY_ORDER.filter((c) => map.has(c)).map((c) => [c, map.get(c)!] as const);
  }, [filtered]);

  if (!ready || !user) return null;

  return (
    <div className="flex-1 px-4 sm:px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <PageHeader title={t.title} subtitle={t.subtitle} count={words.length} />

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.searchPlaceholder}
          className="w-full rounded-xl border border-border bg-surface px-4 py-3 mb-8 outline-none focus:ring-2 focus:ring-primary"
        />

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center py-20 text-foreground/60">{t.empty}</p>
        ) : (
          <div className="space-y-8">
            {grouped.map(([category, categoryWords]) => (
              <div key={category}>
                <h2 className="font-bold text-sm text-foreground/60 mb-3 uppercase tracking-wide">
                  {t.categories[category]}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {categoryWords.map((w) => (
                    <Card key={w._id} className="p-4">
                      <button type="button" onClick={() => setSelected(w)} className="w-full text-left flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold">
                            {w.word} {w.korean && <span className="text-foreground/50 font-normal text-sm">— {w.korean}</span>}
                          </p>
                          {w.simpleExplanation[locale] && (
                            <p className="text-sm text-foreground/60 mt-1 line-clamp-2">{w.simpleExplanation[locale]}</p>
                          )}
                        </div>
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            playAudio(w.audioUrl, w.word, "en-US");
                          }}
                          role="button"
                          aria-label="play"
                          className="shrink-0 h-8 w-8 flex items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/15"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                          </svg>
                        </span>
                      </button>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <FunctionWordModal functionWord={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
