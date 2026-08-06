"use client";

import { useRouter } from "next/navigation";
import type { Difficulty, GrammarTopic } from "@/lib/types";
import { useLocale } from "@/hooks/useT";

const LEVEL_Y: Record<Difficulty, number> = { beginner: 36, intermediate: 118, advanced: 200 };
const LEVEL_COLOR: Record<Difficulty, string> = { beginner: "#22c55e", intermediate: "#6366f1", advanced: "#f97316" };
const LEVELS: Difficulty[] = ["beginner", "intermediate", "advanced"];

/** A lightweight SVG diagram: topics as nodes grouped by level, connected by
 * lines wherever a topic lists the other as a related grammar. */
export function GrammarMap({ topics }: { topics: GrammarTopic[] }) {
  const router = useRouter();
  const { locale } = useLocale();
  if (topics.length === 0) return null;

  const grouped: Record<Difficulty, GrammarTopic[]> = { beginner: [], intermediate: [], advanced: [] };
  for (const t of topics) grouped[t.level].push(t);
  for (const lvl of LEVELS) grouped[lvl].sort((a, b) => a.order - b.order);

  const positions = new Map<string, { x: number; y: number }>();
  for (const lvl of LEVELS) {
    grouped[lvl].forEach((t, i) => positions.set(t._id, { x: 44 + i * 92, y: LEVEL_Y[lvl] }));
  }

  const maxCount = Math.max(grouped.beginner.length, grouped.intermediate.length, grouped.advanced.length, 1);
  const width = 44 + maxCount * 92 + 44;
  const height = 236;

  const edges: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (const t of topics) {
    const from = positions.get(t._id);
    if (!from) continue;
    for (const rf of t.relatedFormulas) {
      const to = positions.get(rf.relatedTopicId);
      if (to) edges.push({ x1: from.x, y1: from.y, x2: to.x, y2: to.y });
    }
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-surface-muted/40 py-4">
      <svg width={width} height={height} style={{ minWidth: width }} className="mx-auto block">
        {edges.map((e, i) => (
          <path
            key={i}
            d={`M ${e.x1} ${e.y1} Q ${(e.x1 + e.x2) / 2} ${(e.y1 + e.y2) / 2 - 18} ${e.x2} ${e.y2}`}
            stroke="currentColor"
            className="text-border"
            strokeWidth={1.5}
            fill="none"
            opacity={0.7}
          />
        ))}
        {topics.map((t) => {
          const pos = positions.get(t._id);
          if (!pos) return null;
          const label = t.title[locale];
          const short = label.length > 13 ? `${label.slice(0, 12)}…` : label;
          return (
            <g
              key={t._id}
              transform={`translate(${pos.x}, ${pos.y})`}
              onClick={() => router.push(`/grammar/${t._id}`)}
              className="cursor-pointer"
            >
              <circle r={7} fill={LEVEL_COLOR[t.level]} />
              <text y={20} textAnchor="middle" fontSize={9} className="fill-foreground/70 font-medium">
                {short}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
