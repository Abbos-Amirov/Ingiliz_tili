"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useT } from "@/hooks/useT";
import { apiFetch } from "@/lib/api";
import type { Difficulty, QuestionAnswerPair } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { QuestionAnswerBuilder } from "@/components/questionAnswers/QuestionAnswerBuilder";

const LEVELS: Difficulty[] = ["beginner", "intermediate", "advanced"];
const CATEGORY_FILTERS = ["all", "yes_no", "wh_question"] as const;
type CategoryFilter = (typeof CATEGORY_FILTERS)[number];

export default function QuestionAnswersPage() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const t = useT("questionAnswers");
  const tSentence = useT("sentence");

  const [level, setLevel] = useState<Difficulty>("beginner");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [mode, setMode] = useState<"A" | "B">("A");
  const [pairs, setPairs] = useState<QuestionAnswerPair[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  useEffect(() => {
    if (!user) return;
    // Fetch-on-mount/filter-change against the separate Express API;
    // setLoading(true) fires synchronously before the await, which is the
    // intended loading-state pattern.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    const query = new URLSearchParams({ level });
    if (category !== "all") query.set("questionCategory", category);
    apiFetch<{ pairs: QuestionAnswerPair[] }>(`/question-answers?${query.toString()}`)
      .then((res) => {
        setPairs(res.pairs);
        setIndex(0);
      })
      .finally(() => setLoading(false));
  }, [user, level, category]);

  if (!ready || !user) return null;

  const current = pairs[index];

  const categoryLabel: Record<CategoryFilter, string> = {
    all: t.categoryAll,
    yes_no: t.categoryYesNo,
    wh_question: t.categoryWh,
  };

  return (
    <div className="flex-1 px-4 sm:px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <PageHeader title={t.title} subtitle={t.subtitle} count={pairs.length} />

        <div className="flex justify-center gap-2 mb-4 flex-wrap">
          {LEVELS.map((lvl) => (
            <button
              key={lvl}
              onClick={() => setLevel(lvl)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                level === lvl ? "gradient-primary text-white" : "bg-surface-muted text-foreground/70 hover:text-foreground"
              }`}
            >
              {tSentence.levels[lvl]}
            </button>
          ))}
        </div>

        <div className="flex justify-center gap-2 mb-6 flex-wrap">
          {CATEGORY_FILTERS.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                category === c ? "bg-primary/15 text-primary" : "bg-surface-muted text-foreground/60 hover:text-foreground"
              }`}
            >
              {categoryLabel[c]}
            </button>
          ))}
        </div>

        <div className="flex justify-center mb-8">
          <button
            type="button"
            onClick={() => setMode((m) => (m === "A" ? "B" : "A"))}
            className="px-4 py-2 rounded-xl border-2 border-border bg-surface text-sm font-semibold text-foreground/70 hover:border-primary hover:text-primary transition-colors"
          >
            {t.modeToggleBtn}
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
        ) : pairs.length === 0 || !current ? (
          <p className="text-center py-20 text-foreground/60">{t.empty}</p>
        ) : (
          <motion.div key={`${current.question._id}-${mode}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
            <p className="text-center text-xs text-foreground/40 mb-3">
              {t.pairLabel} {index + 1}/{pairs.length}
            </p>
            <QuestionAnswerBuilder
              promptSentence={mode === "A" ? current.question : current.answer}
              targetSentence={mode === "A" ? current.answer : current.question}
              mode={mode}
              onComplete={() => setIndex((i) => (i + 1) % pairs.length)}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}
