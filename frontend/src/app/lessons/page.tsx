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

export default function LessonsPage() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const t = useT("lessons");
  const tMatch = useT("match");
  const tSentence = useT("sentence");

  const [lessons, setLessons] = useState<Lesson[] | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  useEffect(() => {
    apiFetch<{ lessons: Lesson[] }>("/lessons").then((res) => setLessons(res.lessons));
  }, []);

  function toggle(lessonNumber: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(lessonNumber)) next.delete(lessonNumber);
      else next.add(lessonNumber);
      return next;
    });
  }

  function startPractice(mode: "match" | "sentence") {
    if (selected.size === 0) return;
    const lessonsParam = Array.from(selected)
      .sort((a, b) => a - b)
      .join(",");
    router.push(`/lessons/practice?lessons=${lessonsParam}&mode=${mode}`);
  }

  if (!ready || !user) return null;

  return (
    <div className="flex-1 px-4 sm:px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 text-center">
          <h1 className="text-2xl sm:text-3xl font-extrabold">{t.pageTitle}</h1>
          <p className="text-foreground/60 mt-1.5 text-sm sm:text-base">{t.pageSubtitle}</p>
        </div>

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
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {lessons.map((lesson) => {
                const isSelected = selected.has(lesson.lessonNumber);
                return (
                  <motion.button
                    key={lesson.lessonNumber}
                    onClick={() => toggle(lesson.lessonNumber)}
                    whileTap={{ scale: 0.97 }}
                    className="text-left"
                  >
                    <Card
                      className={`p-5 h-full transition-colors ${
                        isSelected ? "border-primary ring-2 ring-primary/30 bg-primary/5" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="font-extrabold text-lg">
                          {t.lessonPrefix}
                          {lesson.lessonNumber}
                          {t.lessonSuffix}
                        </span>
                        <span
                          className={`h-5 w-5 rounded-md border-2 flex items-center justify-center text-xs ${
                            isSelected ? "bg-primary border-primary text-white" : "border-border"
                          }`}
                        >
                          {isSelected && "✓"}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/60">
                        {lesson.wordCount} {t.wordsSuffix}
                        {lesson.sentenceCount > 0 && (
                          <>
                            {" · "}
                            {lesson.sentenceCount} {t.sentencesSuffix}
                          </>
                        )}
                      </p>
                    </Card>
                  </motion.button>
                );
              })}
            </div>

            <div className="mt-8 flex flex-col items-center gap-3">
              {selected.size === 0 && <p className="text-sm text-foreground/50">{t.selectAtLeastOne}</p>}
              <p className="font-semibold text-sm text-foreground/70">{t.modePickerTitle}</p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button size="lg" disabled={selected.size === 0} onClick={() => startPractice("match")}>
                  {tMatch.title}
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  disabled={selected.size === 0}
                  onClick={() => startPractice("sentence")}
                >
                  {tSentence.title}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
