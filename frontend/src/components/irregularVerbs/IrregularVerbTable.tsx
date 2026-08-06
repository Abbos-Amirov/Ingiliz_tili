"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { IrregularVerb, IrregularVerbCategory } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { useT } from "@/hooks/useT";

function groupByCategory(verbs: IrregularVerb[]): [IrregularVerbCategory, IrregularVerb[]][] {
  const map = new Map<IrregularVerbCategory, IrregularVerb[]>();
  for (const v of verbs) {
    const list = map.get(v.category) ?? [];
    list.push(v);
    map.set(v.category, list);
  }
  return Array.from(map.entries());
}

export function IrregularVerbTable() {
  const t = useT("irregularVerbs");
  const [verbs, setVerbs] = useState<IrregularVerb[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ verbs: IrregularVerb[] }>("/irregular-verbs?limit=500")
      .then((res) => setVerbs(res.verbs))
      .finally(() => setLoading(false));
  }, []);

  const groups = useMemo(() => groupByCategory(verbs), [verbs]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (verbs.length === 0) {
    return <p className="text-center py-20 text-foreground/60">{t.empty}</p>;
  }

  return (
    <div className="space-y-6">
      {groups.map(([category, list]) => (
        <div key={category}>
          <h2 className="font-bold text-sm text-foreground/60 mb-2 uppercase tracking-wide">
            {t.categories[category]} ({list.length})
          </h2>
          <Card className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-foreground/50 border-b border-border">
                  <th className="px-4 py-3 font-medium">{t.base}</th>
                  <th className="px-4 py-3 font-medium">{t.past}</th>
                  <th className="px-4 py-3 font-medium">{t.participle}</th>
                  <th className="px-4 py-3 font-medium">{t.korean}</th>
                </tr>
              </thead>
              <tbody>
                {list.map((v) => (
                  <tr key={v._id} className="border-b border-border last:border-0 hover:bg-surface-muted">
                    <td className="px-4 py-3 font-semibold">{v.base}</td>
                    <td className="px-4 py-3">{v.past}</td>
                    <td className="px-4 py-3">{v.participle}</td>
                    <td className="px-4 py-3">{v.korean}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      ))}
    </div>
  );
}
