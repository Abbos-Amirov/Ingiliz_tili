"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useLocale, useT } from "@/hooks/useT";
import { apiFetch } from "@/lib/api";
import { pick, type TextbookLessonSummary } from "@/lib/textbook";
import { PageHeader } from "@/components/ui/PageHeader";
import { Asterisk } from "@/components/ui/Shapes";

// "수업" — the Pallo! textbook lessons. (The old word-lesson cards that used
// to live here were removed from this page only; their words/sentences are
// untouched and still power Flashcards, All Words and /lessons/practice.)
export default function LessonsPage() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const t = useT("lessons");
  const tb = useT("textbook");
  const { locale } = useLocale();
  const [lessons, setLessons] = useState<TextbookLessonSummary[] | null>(null);

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  useEffect(() => {
    if (!ready || !user) return;
    apiFetch<{ lessons: TextbookLessonSummary[] }>("/textbook/lessons")
      .then((res) => setLessons(res.lessons))
      .catch(() => setLessons([]));
  }, [ready, user]);

  if (!ready || !user) return null;

  return (
    <div className="flex-1 px-4 sm:px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <PageHeader title={t.pageTitle} subtitle={tb.listSubtitle} count={lessons?.length} countLabel={tb.lessonsSuffix} />

        {lessons && lessons.length === 0 && <p className="text-center text-foreground/60">{tb.empty}</p>}

        <div className="grid gap-4">
          {lessons?.map((l, i) => {
            const total = l.puzzleTotal + l.storyTotal;
            const done = l.puzzleDone + l.storyDone;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
            return (
              <motion.div
                key={l._id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  href={`/lessons/${l.lessonNumber}`}
                  className="group relative flex items-center gap-4 overflow-hidden rounded-3xl border border-border bg-surface card-shadow p-5 sm:p-6 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[var(--shadow-soft)]"
                >
                  <Asterisk
                    size={120}
                    outline
                    color="color-mix(in srgb, var(--brand) 10%, transparent)"
                    className="absolute -right-6 -bottom-8 transition-transform duration-500 group-hover:rotate-45"
                  />
                  <div className="relative shrink-0 flex h-16 w-16 flex-col items-center justify-center rounded-2xl bg-ink text-on-ink">
                    <span className="font-serif text-2xl font-bold leading-none text-gold">{l.lessonNumber}</span>
                    <span className="text-[10px] font-bold opacity-70 mt-0.5">
                      {tb.lessonPrefix}
                      {tb.lessonSuffix.replace(/^-/, "")}
                    </span>
                  </div>
                  <div className="relative flex-1 min-w-0">
                    <p className="font-serif text-xl font-bold leading-tight">{l.title}</p>
                    <p className="text-sm text-foreground/60">{pick(locale, l.titleKo, l.titleUz)}</p>
                    <div className="mt-3 h-2 rounded-full bg-surface-muted overflow-hidden">
                      <div className="h-full gradient-primary rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="mt-1.5 text-xs text-foreground/55">
                      {l.keywordCount} {tb.keywordsCount} · {tb.puzzleProgress} {l.puzzleDone}/{l.puzzleTotal} · {tb.storyProgress}{" "}
                      {l.storyDone}/{l.storyTotal}
                    </p>
                  </div>
                  <span className="relative hidden sm:flex shrink-0 rounded-xl bg-ink text-on-ink px-4 py-2 text-sm font-bold">
                    {done > 0 ? tb.continue : tb.start} →
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
