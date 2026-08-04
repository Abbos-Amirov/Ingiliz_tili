"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import type { Sentence } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { SentenceForm } from "@/components/admin/SentenceForm";

function groupByLesson(sentences: Sentence[]): [number, Sentence[]][] {
  const map = new Map<number, Sentence[]>();
  for (const s of sentences) {
    const list = map.get(s.lessonNumber) ?? [];
    list.push(s);
    map.set(s.lessonNumber, list);
  }
  return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
}

export default function AdminSentencesPage() {
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Sentence | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ sentences: Sentence[] }>("/sentences?limit=500", { admin: true });
      setSentences(res.sentences);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch-on-mount against the separate Express API.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function handleDelete(sentence: Sentence) {
    if (!confirm("Bu gapni o'chirishni tasdiqlaysizmi?")) return;
    setError(null);
    try {
      await apiFetch(`/sentences/${sentence._id}`, { method: "DELETE", admin: true });
      setSentences((prev) => prev.filter((s) => s._id !== sentence._id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "O'chirishda xatolik");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold">Gaplar</h1>
          <p className="text-foreground/60 text-sm mt-1">Jami {sentences.length} ta gap</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        >
          + Gap qo&apos;shish
        </Button>
      </div>

      {error && <p className="text-danger text-sm mb-4">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {groupByLesson(sentences).map(([lessonNumber, lessonSentences]) => (
            <div key={lessonNumber}>
              <h2 className="font-bold text-sm text-foreground/60 mb-2 uppercase tracking-wide">
                {lessonNumber}-dars ({lessonSentences.length})
              </h2>
              <div className="space-y-3">
                {lessonSentences.map((s) => (
                  <Card key={s._id} className="p-4 flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold">{s.korean}</p>
                      <p className="text-sm text-foreground/60 mt-1">{s.englishWords.join(" ")}</p>
                      {s.distractorWords.length > 0 && (
                        <p className="text-xs text-foreground/40 mt-1">
                          Chalg&apos;ituvchi: {s.distractorWords.join(", ")}
                        </p>
                      )}
                      <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-surface-muted text-xs font-medium">
                        {s.level}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 text-sm shrink-0">
                      <button
                        onClick={() => {
                          setEditing(s);
                          setModalOpen(true);
                        }}
                        className="text-primary font-medium hover:underline"
                      >
                        Tahrirlash
                      </button>
                      <button onClick={() => handleDelete(s)} className="text-danger font-medium hover:underline">
                        O&apos;chirish
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Gapni tahrirlash" : "Yangi gap"}
      >
        <SentenceForm
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
