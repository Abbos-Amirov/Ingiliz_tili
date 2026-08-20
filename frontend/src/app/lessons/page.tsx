"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useT } from "@/hooks/useT";
import { apiFetch } from "@/lib/api";
import type { Lesson } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatLessonRange } from "@/lib/lessonRange";

function lessonsQueryParam(lesson: Lesson): string {
  const numbers: number[] = [];
  for (let n = lesson.lessonNumber; n <= lesson.lessonNumberEnd; n++) numbers.push(n);
  return numbers.join(",");
}

export default function LessonsPage() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const t = useT("lessons");
  const tMatch = useT("match");
  const tSentence = useT("sentence");

  const [lessons, setLessons] = useState<Lesson[] | null>(null);

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  useEffect(() => {
    apiFetch<{ lessons: Lesson[] }>("/lessons").then((res) => setLessons(res.lessons));
  }, []);

  if (!ready || !user) return null;

  return (
    <div className="flex-1 px-4 sm:px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <PageHeader
          title={t.pageTitle}
          subtitle={t.pageSubtitle}
          count={lessons?.length}
          countLabel={t.lessonsSuffix}
        />

        <div className="mb-8 flex justify-center">
          <Link href="/all-words">
            <Button variant="secondary">{t.allWordsCta}</Button>
          </Link>
        </div>

        {!lessons ? (
          <div className="flex justify-center py-20">
            <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
        ) : lessons.length === 0 ? (
          <p className="text-center py-20 text-foreground/60">{t.empty}</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {lessons.map((lesson) => {
              const lessonsParam = lessonsQueryParam(lesson);
              const label = `${formatLessonRange(lesson.lessonNumber, lesson.lessonNumberEnd)}${t.lessonSuffix}`;
              return (
                <motion.div key={`${lesson.lessonNumber}-${lesson.lessonNumberEnd}`} whileTap={{ scale: 0.97 }}>
                  <Card className="p-5 h-full flex flex-col">
                    <Link
                      href={`/lessons/practice?lessons=${lessonsParam}&mode=match`}
                      className="flex-1 block"
                      title={tMatch.title}
                    >
                      <span className="font-extrabold text-lg block mb-2">
                        {t.lessonPrefix}
                        {label}
                      </span>
                      <p className="text-sm text-foreground/60">
                        {lesson.wordCount} {t.wordsSuffix}
                        {lesson.sentenceCount > 0 && (
                          <>
                            {" · "}
                            {lesson.sentenceCount} {t.sentencesSuffix}
                          </>
                        )}
                      </p>
                    </Link>
                    {/* Curated Sentence-collection entries (role-tagged, richer) take
                        priority where they exist; otherwise every word already carries
                        its own example sentence, so this link is never dead. */}
                    <Link
                      href={`/lessons/practice?lessons=${lessonsParam}&mode=${lesson.sentenceCount > 0 ? "sentence" : "word-sentences"}`}
                      className="mt-3 pt-3 border-t border-border text-xs font-semibold text-primary hover:underline"
                    >
                      {tSentence.title} →
                    </Link>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
