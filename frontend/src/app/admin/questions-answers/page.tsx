"use client";

import { tf, useAdminT } from "@/hooks/useAdminT";
import { useCallback, useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import type { QuestionAnswerPair } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { QuestionAnswerForm } from "@/components/admin/QuestionAnswerForm";

function groupKey(pair: QuestionAnswerPair): string {
  return `${pair.question.level}-${pair.question.subLevel ?? 2}`;
}

function groupLabel(
  pair: QuestionAnswerPair,
  levels: Record<string, string>,
  stageTemplate: string,
): string {
  const level = levels[pair.question.level ?? "beginner"] ?? pair.question.level;
  return tf(stageTemplate, { level, n: pair.question.subLevel ?? 2 });
}

export default function AdminQuestionAnswersPage() {
  const [pairs, setPairs] = useState<QuestionAnswerPair[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<QuestionAnswerPair | null>(null);
  const [error, setError] = useState<string | null>(null);
  const t = useAdminT("qa");
  const tc = useAdminT("common");
  const tl = useAdminT("levels");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ pairs: QuestionAnswerPair[] }>("/question-answers", { admin: true });
      setPairs(res.pairs);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function handleDelete(pair: QuestionAnswerPair) {
    if (!confirm(t.confirmDelete)) return;
    setError(null);
    try {
      await apiFetch(`/question-answers/${pair.question._id}`, { method: "DELETE", admin: true });
      setPairs((prev) => prev.filter((p) => p.question._id !== pair.question._id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : tc.deleteError);
    }
  }

  const groups = new Map<string, { label: string; pairs: QuestionAnswerPair[] }>();
  for (const pair of pairs) {
    const key = groupKey(pair);
    const g = groups.get(key) ?? { label: groupLabel(pair, tl, t.stage), pairs: [] };
    g.pairs.push(pair);
    groups.set(key, g);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold">{t.title}</h1>
          <p className="text-foreground/60 text-sm mt-1">{tf(t.total, { n: pairs.length })}</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        >
          {t.add}
        </Button>
      </div>

      {error && <p className="text-danger text-sm mb-4">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
      ) : pairs.length === 0 ? (
        <p className="text-center py-20 text-foreground/60">{t.empty}</p>
      ) : (
        <div className="space-y-6">
          {Array.from(groups.entries()).map(([key, group]) => (
            <div key={key}>
              <h2 className="font-bold text-sm text-foreground/60 mb-2 uppercase tracking-wide">
                {group.label} ({group.pairs.length})
              </h2>
              <div className="space-y-3">
                {group.pairs.map((pair) => (
                  <Card key={pair.question._id} className="p-4 flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold mb-1">
                        ❓ {pair.question.words.map((w) => w.text).join(" ")}
                        <span className="text-foreground/40 font-normal"> — {pair.question.korean}</span>
                      </p>
                      <p className="text-sm text-success">
                        ✓ {pair.answer.words.map((w) => w.text).join(" ")}
                        <span className="text-foreground/40"> — {pair.answer.korean}</span>
                      </p>
                      <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-surface-muted text-xs font-medium">
                        {pair.question.questionCategory === "wh_question" ? t.whQuestion : t.yesNo}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 text-sm shrink-0">
                      <button
                        onClick={() => {
                          setEditing(pair);
                          setModalOpen(true);
                        }}
                        className="text-primary font-medium hover:underline"
                      >
                        {tc.edit}
                      </button>
                      <button onClick={() => handleDelete(pair)} className="text-danger font-medium hover:underline">
                        {tc.delete}
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? t.editTitle : t.newTitle}>
        <QuestionAnswerForm
          initial={editing}
          onSaved={() => {
            setModalOpen(false);
            load();
          }}
        />
      </Modal>
    </div>
  );
}
