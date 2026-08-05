"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import type { Sentence } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { SentenceForm } from "@/components/admin/SentenceForm";
import { formatLessonRange } from "@/lib/lessonRange";
import { ROLE_COLORS } from "@/lib/roleColors";

function groupByLesson(sentences: Sentence[]): [string, Sentence[]][] {
  const map = new Map<string, Sentence[]>();
  for (const s of sentences) {
    const key = formatLessonRange(s.lessonNumber, s.lessonNumberEnd);
    const list = map.get(key) ?? [];
    list.push(s);
    map.set(key, list);
  }
  return Array.from(map.entries()).sort((a, b) => {
    const startA = Number(a[0].split("-")[0]);
    const startB = Number(b[0].split("-")[0]);
    return startA - startB;
  });
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
          {groupByLesson(sentences).map(([lessonLabel, lessonSentences]) => (
            <div key={lessonLabel}>
              <h2 className="font-bold text-sm text-foreground/60 mb-2 uppercase tracking-wide">
                {lessonLabel}-dars ({lessonSentences.length})
              </h2>
              <div className="space-y-3">
                {lessonSentences.map((s) => (
                  <Card key={s._id} className="p-4 flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold mb-1.5">{s.korean}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {s.words.map((w, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md text-xs font-semibold"
                            style={{ backgroundColor: ROLE_COLORS[w.role].bg, color: ROLE_COLORS[w.role].text }}
                            title={ROLE_COLORS[w.role].label}
                          >
                            {w.text}
                          </span>
                        ))}
                      </div>
                      {s.distractorWords.length > 0 && (
                        <p className="text-xs text-foreground/40 mt-1.5">
                          Chalg&apos;ituvchi: {s.distractorWords.map((w) => w.text).join(", ")}
                        </p>
                      )}
                      {s.formula && (
                        <p className="text-xs text-foreground/40 mt-1 font-mono">{s.formula}</p>
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
