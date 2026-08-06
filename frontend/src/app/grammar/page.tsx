"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useT } from "@/hooks/useT";
import { useGrammarTopics } from "@/hooks/useGrammarTopics";
import type { Difficulty, GrammarTopic, GrammarTopicProgress } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { GrammarTopicCard } from "@/components/grammar/GrammarTopicCard";
import { GrammarMap } from "@/components/grammar/GrammarMap";

const LEVEL_ORDER: Difficulty[] = ["beginner", "intermediate", "advanced"];
const MASTERY_THRESHOLD = 70;

export default function GrammarHubPage() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const t = useT("grammar");
  const { fetchTopics, fetchProgressSummary } = useGrammarTopics();

  const [level, setLevel] = useState<Difficulty>("beginner");
  const [topics, setTopics] = useState<GrammarTopic[]>([]);
  const [progress, setProgress] = useState<GrammarTopicProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  useEffect(() => {
    if (!user) return;
    Promise.all([fetchTopics(), fetchProgressSummary()])
      .then(([topicsRes, progressRes]) => {
        setTopics(topicsRes.topics);
        setProgress(progressRes.progress);
      })
      .finally(() => setLoading(false));
  }, [user, fetchTopics, fetchProgressSummary]);

  const masteryByTopic = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of progress) {
      map.set(p.topicId, p.questionsTotal > 0 ? Math.round((p.questionsCorrect / p.questionsTotal) * 100) : 0);
    }
    return map;
  }, [progress]);

  const levelAverage = useMemo(() => {
    const result: Record<Difficulty, number> = { beginner: 0, intermediate: 0, advanced: 0 };
    for (const lvl of LEVEL_ORDER) {
      const lvlTopics = topics.filter((tp) => tp.level === lvl);
      const attempted = lvlTopics.filter((tp) => (masteryByTopic.get(tp._id) ?? -1) >= 0 && progress.some((p) => p.topicId === tp._id));
      if (attempted.length === 0) {
        result[lvl] = 0;
        continue;
      }
      const sum = attempted.reduce((acc, tp) => acc + (masteryByTopic.get(tp._id) ?? 0), 0);
      result[lvl] = Math.round(sum / attempted.length);
    }
    return result;
  }, [topics, progress, masteryByTopic]);

  function isLocked(lvl: Difficulty): boolean {
    const idx = LEVEL_ORDER.indexOf(lvl);
    if (idx === 0) return false;
    return levelAverage[LEVEL_ORDER[idx - 1]] < MASTERY_THRESHOLD;
  }

  const levelTopics = topics.filter((tp) => tp.level === level).sort((a, b) => a.order - b.order);
  const locked = isLocked(level);

  if (!ready || !user) return null;

  return (
    <div className="flex-1 px-4 sm:px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <PageHeader title={t.title} subtitle={t.subtitle} count={topics.length} countLabel={t.topicsSuffix} />

        <div className="flex justify-center gap-2 mb-8 flex-wrap">
          {LEVEL_ORDER.map((lvl) => (
            <button
              key={lvl}
              onClick={() => setLevel(lvl)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors min-h-11 ${
                level === lvl ? "gradient-primary text-white" : "bg-surface-muted text-foreground/70 hover:text-foreground"
              }`}
            >
              {t.levels[lvl]} {isLocked(lvl) ? "🔒" : ""}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
        ) : levelTopics.length === 0 ? (
          <p className="text-center py-20 text-foreground/60">{t.empty}</p>
        ) : (
          <>
            {locked && (
              <div className="mb-6 rounded-xl bg-accent-soft border border-accent/30 px-4 py-3 text-sm text-accent text-center">
                {t.lockedHint}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {levelTopics.map((tp) => (
                <GrammarTopicCard
                  key={tp._id}
                  topic={tp}
                  masteryPercent={masteryByTopic.get(tp._id) ?? 0}
                  locked={locked}
                />
              ))}
            </div>
          </>
        )}

        {!loading && topics.length > 0 && (
          <div className="mt-14">
            <h2 className="text-center font-bold text-lg mb-4">{t.mapTitle}</h2>
            <GrammarMap topics={topics} />
          </div>
        )}
      </div>
    </div>
  );
}
