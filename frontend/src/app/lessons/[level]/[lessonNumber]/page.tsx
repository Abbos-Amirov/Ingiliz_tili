"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useLocale, useT } from "@/hooks/useT";
import { apiFetch } from "@/lib/api";
import { pick, type KeywordPos, type TextbookLessonResponse } from "@/lib/textbook";
import { Asterisk, DotGrid, Ring } from "@/components/ui/Shapes";
import { PlayAllButton, TextbookAudioContext } from "@/components/textbook/PronunciationButton";
import { KeywordCard } from "@/components/textbook/KeywordCard";
import { VerbOverview } from "@/components/textbook/VerbOverview";
import { VerbClassificationQuiz } from "@/components/textbook/VerbClassificationQuiz";
import { TransformOverview } from "@/components/textbook/TransformOverview";
import { PuzzleSection } from "@/components/textbook/PuzzleSection";
import { StorySection } from "@/components/textbook/StorySection";
import { WeaknessInsight } from "@/components/textbook/WeaknessInsight";
import { SelfTransformSection } from "@/components/textbook/SelfTransformSection";
import { FreeTalkSection, SentencePracticeSection } from "@/components/textbook/SentencePracticeSection";

const POS_ORDER: KeywordPos[] = ["noun", "verb", "adjective"];
const POS_STYLE: Record<KeywordPos, string> = {
  noun: "bg-emerald-600 text-white",
  verb: "bg-primary text-white dark:text-[#1b1035]",
  adjective: "bg-ink text-on-ink",
};

function Section({
  id,
  number,
  title,
  subtitle,
  action,
  children,
}: {
  id: string;
  number?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="flex items-start gap-3 mb-4">
        {number !== undefined && (
          <span className="shrink-0 h-9 w-9 rounded-full bg-ink text-gold font-serif font-bold text-lg flex items-center justify-center">
            {number}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold">{title}</h2>
          {subtitle && <p className="text-sm text-foreground/60 mt-0.5">{subtitle}</p>}
          {action && <div className="mt-2.5">{action}</div>}
        </div>
      </div>
      {children}
    </section>
  );
}

export default function TextbookLessonPage() {
  const params = useParams<{ level: string; lessonNumber: string }>();
  const level = Number(params.level);
  const lessonNumber = Number(params.lessonNumber);
  const lessonPath = `/textbook/books/${level}/lessons/${lessonNumber}`;
  const { user, ready } = useAuth();
  const router = useRouter();
  const t = useT("textbook");
  const { locale } = useLocale();
  const [data, setData] = useState<TextbookLessonResponse | null>(null);
  const [failed, setFailed] = useState(false);
  const [mistakeRefresh, setMistakeRefresh] = useState(0);

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  useEffect(() => {
    if (!ready || !user || !Number.isInteger(level) || !Number.isInteger(lessonNumber)) return;
    apiFetch<TextbookLessonResponse>(lessonPath)
      .then(setData)
      .catch(() => setFailed(true));
  }, [ready, user, level, lessonNumber, lessonPath]);

  if (!ready || !user) return null;

  if (failed) {
    return (
      <div className="flex-1 px-4 py-16 text-center">
        <p className="text-foreground/60">{t.loadError}</p>
        <Link href={`/lessons/${level}`} className="mt-4 inline-block text-primary font-semibold">
          {t.backToLessons}
        </Link>
      </div>
    );
  }
  if (!data) {
    return <div className="flex-1 flex items-center justify-center py-24 text-foreground/40">…</div>;
  }

  const { lesson, progress } = data;
  const lessonLabel = `${t.lessonPrefix}${lesson.lessonNumber}${t.lessonSuffix}`;
  const navItems = [
    { id: "keywords", label: `0 · ${t.keywordsTitle}` },
    { id: "transforms", label: t.transformTitle },
    { id: "puzzle", label: `1 · ${t.puzzleTitle}` },
    { id: "story", label: `2 · ${t.storyTitle}` },
    ...(lesson.selfTransform.length > 0 ? [{ id: "self-transform", label: `3 · ${t.selfTransformTitle}` }] : []),
    ...(lesson.sentencePractice.length > 0 ? [{ id: "practice", label: `4 · ${t.practiceTitle}` }] : []),
  ];

  // Puzzle rows and self-transform rows share completedExercises.
  function markDone(key: string, field: "puzzleDone" | "drillDone") {
    setData((d) =>
      d && !d.progress.completedExercises.includes(key)
        ? {
            ...d,
            progress: {
              ...d.progress,
              completedExercises: [...d.progress.completedExercises, key],
              [field]: d.progress[field] + 1,
            },
          }
        : d,
    );
  }

  return (
    <TextbookAudioContext.Provider value={data.audio}>
      <div className="flex-1 px-3 sm:px-6 py-6 sm:py-8">
        <div className="mx-auto max-w-5xl space-y-12">
          <div>
            <Link href={`/lessons/${level}`} className="text-sm font-semibold text-foreground/55 hover:text-foreground">
              {t.backToLessons}
            </Link>

            {/* Lesson hero */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative mt-3 overflow-hidden rounded-[2rem] ink-panel px-6 py-8 sm:px-10 sm:py-10"
            >
              <Asterisk size={140} outline color="rgba(255,255,255,0.08)" className="absolute -right-6 -top-8" />
              <Ring size={70} stroke={6} color="rgba(233,168,35,0.45)" className="absolute right-24 bottom-6 hidden sm:block" />
              <DotGrid cols={5} rows={3} gap={12} color="rgba(255,255,255,0.18)" className="absolute left-6 bottom-5 hidden sm:block" />
              <div className="relative flex items-center gap-2">
                <span className="inline-flex rounded-xl bg-gold px-3 py-1 font-serif text-lg font-bold text-[#1b1035]">
                  {lessonLabel}
                </span>
                <span className="rounded-full border border-white/25 px-2.5 py-0.5 text-xs font-bold text-on-ink/80">
                  Lv.{lesson.level}
                </span>
              </div>
              <h1 className="relative mt-3 text-4xl sm:text-5xl font-bold text-on-ink">{lesson.title}</h1>
              <p className="relative mt-1 text-on-ink/70">{pick(locale, lesson.titleKo, lesson.titleUz)}</p>
              <div className="relative mt-5 flex flex-wrap gap-2 text-xs font-bold">
                <span className="rounded-full bg-white/10 px-3 py-1 text-on-ink">
                  {t.puzzleProgress} {progress.puzzleDone}/{progress.puzzleTotal}
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-on-ink">
                  {t.storyProgress} {progress.storyDone}/{progress.storyTotal}
                </span>
                {progress.drillTotal > 0 && (
                  <span className="rounded-full bg-white/10 px-3 py-1 text-on-ink">
                    {t.drillProgress} {progress.drillDone}/{progress.drillTotal}
                  </span>
                )}
              </div>
            </motion.div>

            {/* Section jump links */}
            <nav className="mt-4 flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              {navItems.map((n) => (
                <a
                  key={n.id}
                  href={`#${n.id}`}
                  className="shrink-0 rounded-full border border-border bg-surface px-3.5 py-1.5 text-sm font-semibold text-foreground/70 hover:border-primary/40 hover:text-primary"
                >
                  {n.label}
                </a>
              ))}
            </nav>

            <WeaknessInsight refreshKey={mistakeRefresh} className="mt-4" />
          </div>

          {/* 0. Keywords + 동사 한눈에 보기 + verb quiz */}
          <Section
            id="keywords"
            number="0"
            title={t.keywordsTitle}
            subtitle={t.keywordsSubtitle}
            action={<PlayAllButton texts={POS_ORDER.flatMap((pos) => lesson.keywords.filter((k) => k.partOfSpeech === pos).map((k) => k.word))} />}
          >
            <div className="grid gap-3 sm:grid-cols-3 mb-5">
              {lesson.partOfSpeechGuide.map((g) => (
                <div key={g.partOfSpeech} className="rounded-2xl border border-border bg-surface p-4 text-center">
                  <p className="font-bold">{t.pos[g.partOfSpeech]}</p>
                  <p className="text-sm text-foreground/65 mt-1">{pick(locale, g.descriptionKo, g.descriptionUz)}</p>
                  <p className="text-xs text-foreground/45 mt-1">{pick(locale, g.exampleKo, g.exampleUz)}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              {POS_ORDER.map((pos) => {
                const items = lesson.keywords.filter((k) => k.partOfSpeech === pos);
                if (items.length === 0) return null;
                return (
                  <div key={pos}>
                    <div className={`mb-2.5 flex items-center justify-center gap-2 rounded-xl py-1.5 pl-4 pr-1.5 font-bold ${POS_STYLE[pos]}`}>
                      <span className="flex-1 text-center">
                        {t.pos[pos]} ({items.length})
                      </span>
                      <PlayAllButton variant="icon" texts={items.map((k) => k.word)} label={`${t.pos[pos]} — ${t.listenAll}`} />
                    </div>
                    <div className="grid gap-2.5">
                      {items.map((k) => (
                        <KeywordCard key={k.word} keyword={k} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 grid gap-5 lg:grid-cols-[1.4fr_1fr] items-start">
              <VerbOverview lesson={lesson} />
              <VerbClassificationQuiz lessonPath={lessonPath} quiz={lesson.verbClassificationQuiz} />
            </div>
          </Section>

          {/* 변형 한눈에 보기 */}
          <Section id="transforms" title={t.transformTitle} subtitle={t.transformSubtitle}>
            <TransformOverview lesson={lesson} />
          </Section>

          {/* 1. 오늘의 퍼즐 */}
          <Section
            id="puzzle"
            number="1"
            title={t.puzzleTitle}
            subtitle={t.puzzleSubtitle}
            action={<PlayAllButton texts={data.playlists?.puzzles.flat() ?? lesson.puzzles.map((p) => p.baseSentence)} />}
          >
            <PuzzleSection
              playlists={data.playlists?.puzzles}
              lessonPath={lessonPath}
              puzzles={lesson.puzzles}
              completed={progress.completedExercises}
              onRowDone={(key) => markDone(key, "puzzleDone")}
            />
          </Section>

          {/* 2. Our Story */}
          <Section
            id="story"
            number="2"
            title={t.storyTitle}
            subtitle={t.storySubtitle}
            action={<PlayAllButton texts={lesson.storyQuestions.flatMap((q) => [q.question, q.examples[1] ?? ""])} />}
          >
            <StorySection
              lessonId={lesson._id}
              questions={lesson.storyQuestions}
              answers={progress.storyAnswers}
              checklist={progress.checklist}
              onGraded={(answer, extra) => {
                setData((d) =>
                  d
                    ? {
                        ...d,
                        progress: {
                          ...d.progress,
                          checklist: extra.checklist,
                          storyDone: extra.storyDone,
                          storyTotal: extra.storyTotal,
                          storyAnswers: [
                            ...d.progress.storyAnswers.filter(
                              (a) => !(a.questionKey === answer.questionKey && a.round === answer.round),
                            ),
                            answer,
                          ],
                        },
                      }
                    : d,
                );
                if (!answer.isCorrect) setMistakeRefresh((n) => n + 1);
              }}
            />
          </Section>

          {/* 3. 스스로 변형하기 */}
          {lesson.selfTransform.length > 0 && (
            <Section
              id="self-transform"
              number="3"
              title={t.selfTransformTitle}
              subtitle={t.selfTransformSubtitle}
              action={data.playlists && <PlayAllButton texts={data.playlists.selfTransform.flat()} />}
            >
              <SelfTransformSection
                playlists={data.playlists?.selfTransform}
                lessonPath={lessonPath}
                blocks={lesson.selfTransform}
                completed={progress.completedExercises}
                onRowDone={(key) => markDone(key, "drillDone")}
              />
            </Section>
          )}

          {/* 4. 문장 연습 + 프리토킹 */}
          {lesson.sentencePractice.length > 0 && (
            <Section
              id="practice"
              number="4"
              title={t.practiceTitle}
              subtitle={t.practiceSubtitle}
              action={<PlayAllButton texts={lesson.sentencePractice.map((x) => x.english)} />}
            >
              <SentencePracticeSection sentences={lesson.sentencePractice} />
            </Section>
          )}
          {lesson.freeTalk.length > 0 && (
            <Section
              id="free-talk"
              title={t.freeTalkTitle}
              subtitle={t.freeTalkSubtitle}
              action={<PlayAllButton texts={lesson.freeTalk.map((x) => x.question)} />}
            >
              <FreeTalkSection questions={lesson.freeTalk} />
            </Section>
          )}
        </div>
      </div>
    </TextbookAudioContext.Provider>
  );
}
