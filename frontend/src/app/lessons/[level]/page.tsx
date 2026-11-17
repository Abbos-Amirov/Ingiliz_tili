"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useLocale, useT } from "@/hooks/useT";
import { apiFetch } from "@/lib/api";
import { pick, type TextbookBook, type TextbookLessonSummary } from "@/lib/textbook";
import { Asterisk } from "@/components/ui/Shapes";

// One textbook's lessons (e.g. /lessons/0 = Lv.0 "Hello English").
export default function BookLessonsPage() {
  const params = useParams<{ level: string }>();
  const level = Number(params.level);
  const { user, ready } = useAuth();
  const router = useRouter();
  const tb = useT("textbook");
  const { locale } = useLocale();
  const [book, setBook] = useState<TextbookBook | null>(null);
  const [lessons, setLessons] = useState<TextbookLessonSummary[] | null>(null);

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  useEffect(() => {
    if (!ready || !user || !Number.isInteger(level)) return;
    apiFetch<{ book: TextbookBook; lessons: TextbookLessonSummary[] }>(`/textbook/books/${level}/lessons`)
      .then((res) => {
        setBook(res.book);
        setLessons(res.lessons);
      })
      .catch(() => setLessons([]));
  }, [ready, user, level]);

  if (!ready || !user) return null;

  return (
    <div className="flex-1 px-4 sm:px-6 py-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/lessons" className="text-sm font-semibold text-foreground/55 hover:text-foreground">
          {tb.backToBooks}
        </Link>

        {/* Book header: small cover + title */}
        <div className="mt-4 mb-8 flex items-center gap-5">
          <div className="relative h-36 w-[108px] shrink-0 overflow-hidden rounded-r-[8px] rounded-l-[3px] bg-ink shadow-[0_18px_30px_-14px_rgba(27,16,53,0.55)] ring-1 ring-black/5">
            {book?.coverUrl ? (
              <Image src={book.coverUrl} alt={`Pallo Lv.${level} ${book.title}`} fill unoptimized sizes="108px" className="object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center font-serif text-2xl font-bold text-gold">Lv.{level}</div>
            )}
          </div>
          <div>
            <span className="inline-flex rounded-full bg-ink px-2.5 py-0.5 text-xs font-bold text-gold">Lv.{level}</span>
            <h1 className="mt-2 text-3xl sm:text-4xl font-bold">{book?.title ?? "…"}</h1>
            {book?.subtitle && <p className="text-foreground/60 font-semibold tracking-wide uppercase text-xs mt-1">{book.subtitle}</p>}
            {lessons && (
              <p className="mt-2 text-sm text-foreground/60">
                {lessons.length} {tb.lessonsSuffix} · {tb.listSubtitle}
              </p>
            )}
          </div>
        </div>

        {lessons && lessons.length === 0 && <p className="text-center text-foreground/60 py-10">{tb.empty}</p>}

        <div className="grid gap-4">
          {lessons?.map((l, i) => {
            const total = l.puzzleTotal + l.storyTotal;
            const done = l.puzzleDone + l.storyDone;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
            return (
              <motion.div key={l._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Link
                  href={`/lessons/${level}/${l.lessonNumber}`}
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
                      {tb.lessonPrefix.trim()}
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
