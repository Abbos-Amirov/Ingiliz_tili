"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useT } from "@/hooks/useT";
import { apiFetch } from "@/lib/api";
import type { TextbookBookSummary } from "@/lib/textbook";
import { PageHeader } from "@/components/ui/PageHeader";
import { Asterisk } from "@/components/ui/Shapes";

// "수업" — the Pallo! textbook shelf: one small cover per level. Tapping a
// book opens its lessons (/lessons/<level>). Books with no lessons authored
// yet show as "coming soon". (The old word-lesson cards that used to live
// here were removed from this page only; their data is untouched.)
function BookCover({ book }: { book: TextbookBookSummary }) {
  return (
    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-r-[10px] rounded-l-[4px] bg-ink shadow-[0_22px_34px_-16px_rgba(27,16,53,0.6)] ring-1 ring-black/5">
      {book.coverUrl ? (
        <Image
          src={book.coverUrl}
          alt={`Pallo Lv.${book.level} ${book.title}`}
          fill
          unoptimized
          sizes="200px"
          className="object-cover"
        />
      ) : (
        <div className="ink-panel flex h-full flex-col items-center justify-center gap-2 p-3 text-center">
          <Asterisk size={36} color="rgba(233,168,35,0.85)" />
          <p className="font-serif text-3xl font-bold text-on-ink">PALLO</p>
          <span className="rounded-full border border-white/30 px-3 py-0.5 font-serif text-sm font-bold text-gold">
            Lv.{book.level}
          </span>
        </div>
      )}
      {/* spine shading so it reads as a book */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/30 to-transparent" />
    </div>
  );
}

export default function TextbookShelfPage() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const t = useT("lessons");
  const tb = useT("textbook");
  const [books, setBooks] = useState<TextbookBookSummary[] | null>(null);

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  useEffect(() => {
    if (!ready || !user) return;
    apiFetch<{ books: TextbookBookSummary[] }>("/textbook/books")
      .then((res) => setBooks(res.books))
      .catch(() => setBooks([]));
  }, [ready, user]);

  if (!ready || !user) return null;

  return (
    <div className="flex-1 px-4 sm:px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <PageHeader title={t.pageTitle} subtitle={tb.shelfSubtitle} />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 sm:gap-7">
          {books?.map((book, i) => {
            const pct = book.total > 0 ? Math.round((book.done / book.total) * 100) : 0;
            const content = (
              <>
                <div className={`transition-transform duration-300 ${book.available ? "group-hover:-translate-y-1.5 group-hover:-rotate-1" : "opacity-60 grayscale"}`}>
                  <BookCover book={book} />
                </div>
                <div className="mt-3 text-center">
                  <p className="text-xs font-bold text-accent">Lv.{book.level}</p>
                  <p className="font-serif font-bold leading-tight">{book.title}</p>
                  {book.available ? (
                    <>
                      <p className="mt-1 text-xs text-foreground/55">
                        {book.lessonCount} {tb.lessonsSuffix}
                        {book.done > 0 && ` · ${tb.bookProgress} ${pct}%`}
                      </p>
                      <span className="mt-2 inline-flex rounded-lg bg-ink px-3 py-1.5 text-xs font-bold text-on-ink group-hover:bg-ink-soft">
                        {tb.openBook} →
                      </span>
                    </>
                  ) : (
                    <span className="mt-2 inline-flex rounded-lg bg-surface-muted px-3 py-1.5 text-xs font-bold text-foreground/50">
                      {tb.comingSoon}
                    </span>
                  )}
                </div>
              </>
            );
            return (
              <motion.div
                key={book.level}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="mx-auto w-full max-w-[200px]"
              >
                {book.available ? (
                  <Link href={`/lessons/${book.level}`} className="group block" aria-label={`Lv.${book.level} ${book.title}`}>
                    {content}
                  </Link>
                ) : (
                  <div className="cursor-default" aria-disabled>
                    {content}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {books && books.length === 0 && <p className="text-center text-foreground/60">{tb.empty}</p>}
      </div>
    </div>
  );
}
