"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useT } from "@/hooks/useT";
import type { MistakeStat } from "@/lib/textbook";

// "💡 Siz ko'proq X da xato qilasiz (N marta)" — from GET /user/mistake-stats.
// Renders nothing until the learner has made at least one recorded mistake.
// `refreshKey` lets a parent re-fetch after new answers are graded.
export function WeaknessInsight({ refreshKey = 0, className = "" }: { refreshKey?: number; className?: string }) {
  const t = useT("textbook");
  const [stats, setStats] = useState<MistakeStat[] | null>(null);

  useEffect(() => {
    apiFetch<MistakeStat[]>("/user/mistake-stats")
      .then(setStats)
      .catch(() => setStats([]));
  }, [refreshKey]);

  if (!stats || stats.length === 0) return null;
  const top = stats[0];
  const others = stats.slice(1, 4);

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-accent/30 bg-accent-soft/60 p-4 ${className}`}>
      <p className="font-semibold">
        💡 {t.weaknessPrefix} <b className="text-accent">{t.weakness[top._id]}</b> {t.weaknessSuffix}{" "}
        <span className="text-foreground/60">
          ({top.count} {t.weaknessTimes})
        </span>
      </p>
      <p className="text-sm text-foreground/70 mt-1">{t.weaknessAdvice}</p>
      {others.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {others.map((s) => (
            <span key={s._id} className="rounded-full bg-surface border border-border px-2.5 py-0.5 text-xs">
              {t.weakness[s._id]} · {s.count}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
