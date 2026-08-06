"use client";

import { useCallback, useEffect, useState } from "react";
import type { Difficulty, GrammarTopic } from "@/lib/types";
import { apiFetch, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { GrammarTopicForm } from "@/components/admin/GrammarTopicForm";

const LEVELS: { value: Difficulty; label: string }[] = [
  { value: "beginner", label: "Boshlang'ich" },
  { value: "intermediate", label: "O'rta" },
  { value: "advanced", label: "Murakkab" },
];

export default function AdminGrammarPage() {
  const [topics, setTopics] = useState<GrammarTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [level, setLevel] = useState<Difficulty>("beginner");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<GrammarTopic | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ topics: GrammarTopic[] }>("/grammar-topics", { admin: true });
      setTopics(res.topics);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch-on-mount against the separate Express API.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(t: GrammarTopic) {
    setEditing(t);
    setModalOpen(true);
  }

  async function handleDelete(t: GrammarTopic) {
    if (!confirm(`"${t.title.uz}" mavzusini o'chirishni tasdiqlaysizmi?`)) return;
    setError(null);
    try {
      await apiFetch(`/grammar-topics/${t._id}`, { method: "DELETE", admin: true });
      setTopics((prev) => prev.filter((x) => x._id !== t._id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "O'chirishda xatolik");
    }
  }

  const levelTopics = topics.filter((t) => t.level === level).sort((a, b) => a.order - b.order);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Grammatika</h1>
          <p className="text-foreground/60 text-sm mt-1">Jami {topics.length} ta mavzu</p>
        </div>
        <Button onClick={openCreate}>+ Mavzu qo&apos;shish</Button>
      </div>

      <div className="flex gap-2 mb-5">
        {LEVELS.map((l) => (
          <button
            key={l.value}
            onClick={() => setLevel(l.value)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              level === l.value ? "gradient-primary text-white" : "bg-surface-muted text-foreground/70 hover:text-foreground"
            }`}
          >
            {l.label} ({topics.filter((t) => t.level === l.value).length})
          </button>
        ))}
      </div>

      {error && <p className="text-danger text-sm mb-4">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-foreground/50 border-b border-border">
                <th className="px-4 py-3 font-medium w-12">#</th>
                <th className="px-4 py-3 font-medium">Nomi</th>
                <th className="px-4 py-3 font-medium">Formula</th>
                <th className="px-4 py-3 font-medium text-right">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {levelTopics.map((t) => (
                <tr key={t._id} className="border-b border-border last:border-0 hover:bg-surface-muted">
                  <td className="px-4 py-3 text-foreground/50">{t.order}</td>
                  <td className="px-4 py-3 font-semibold">{t.title.uz}</td>
                  <td className="px-4 py-3 font-mono text-xs text-foreground/70">{t.formula}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => openEdit(t)} className="text-primary font-medium hover:underline">
                      Tahrirlash
                    </button>
                    <button onClick={() => handleDelete(t)} className="text-danger font-medium hover:underline">
                      O&apos;chirish
                    </button>
                  </td>
                </tr>
              ))}
              {levelTopics.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-foreground/50">
                    Bu darajada mavzu yo&apos;q
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Mavzuni tahrirlash" : "Yangi grammatika mavzusi"}
      >
        <div className="max-h-[70vh] overflow-y-auto pr-1">
          <GrammarTopicForm
            initial={editing}
            allTopics={topics}
            onSaved={() => {
              setModalOpen(false);
              load();
            }}
          />
        </div>
      </Modal>
    </div>
  );
}
