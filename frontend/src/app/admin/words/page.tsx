"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import type { Word } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { WordForm } from "@/components/admin/WordForm";
import { LessonGroup } from "@/components/admin/LessonGroup";
import { formatLessonRange } from "@/lib/lessonRange";

function groupByLesson(words: Word[]): [string, Word[]][] {
  const map = new Map<string, Word[]>();
  for (const w of words) {
    const key = formatLessonRange(w.lessonNumber, w.lessonNumberEnd);
    const list = map.get(key) ?? [];
    list.push(w);
    map.set(key, list);
  }
  return Array.from(map.entries()).sort((a, b) => {
    const startA = Number(a[0].split("-")[0]);
    const startB = Number(b[0].split("-")[0]);
    return startA - startB;
  });
}

export default function AdminWordsPage() {
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Word | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ words: Word[] }>("/words?limit=500", { admin: true });
      setWords(res.words);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch-on-mount against the separate Express API.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const query = search.trim().toLowerCase();
  const searchResults = useMemo(
    () =>
      query
        ? words.filter((w) => w.english.toLowerCase().includes(query) || w.korean.includes(query))
        : [],
    [words, query],
  );

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(word: Word) {
    setEditing(word);
    setModalOpen(true);
  }

  async function handleDelete(word: Word) {
    if (!confirm(`"${word.english}" so'zini o'chirishni tasdiqlaysizmi?`)) return;
    setError(null);
    try {
      await apiFetch(`/words/${word._id}`, { method: "DELETE", admin: true });
      setWords((prev) => prev.filter((w) => w._id !== word._id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "O'chirishda xatolik");
    }
  }

  function renderTable(list: Word[], showLessonColumn: boolean) {
    return (
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-foreground/50 border-b border-border">
              {showLessonColumn && <th className="px-4 py-3 font-medium">Dars</th>}
              <th className="px-4 py-3 font-medium">Ingliz</th>
              <th className="px-4 py-3 font-medium">Koreys</th>
              <th className="px-4 py-3 font-medium">Kategoriya</th>
              <th className="px-4 py-3 font-medium">Daraja</th>
              <th className="px-4 py-3 font-medium text-right">Amallar</th>
            </tr>
          </thead>
          <tbody>
            {list.map((w) => (
              <tr key={w._id} className="border-b border-border last:border-0 hover:bg-surface-muted">
                {showLessonColumn && (
                  <td className="px-4 py-3 text-foreground/60 whitespace-nowrap">
                    {formatLessonRange(w.lessonNumber, w.lessonNumberEnd)}-dars
                  </td>
                )}
                <td className="px-4 py-3 font-semibold">{w.english}</td>
                <td className="px-4 py-3">{w.korean}</td>
                <td className="px-4 py-3 text-foreground/60">{w.category}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-full bg-surface-muted text-xs font-medium">{w.difficulty}</span>
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button onClick={() => openEdit(w)} className="text-primary font-medium hover:underline">
                    Tahrirlash
                  </button>
                  <button onClick={() => handleDelete(w)} className="text-danger font-medium hover:underline">
                    O&apos;chirish
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold">So&apos;zlar</h1>
          <p className="text-foreground/60 text-sm mt-1">Jami {words.length} ta so&apos;z</p>
        </div>
        <Button onClick={openCreate}>+ So&apos;z qo&apos;shish</Button>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="So'z qidirish (ingliz yoki koreys)..."
        className="w-full rounded-xl border border-border bg-surface-muted px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary mb-6"
      />

      {error && <p className="text-danger text-sm mb-4">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
      ) : query ? (
        searchResults.length === 0 ? (
          <p className="text-center py-16 text-foreground/60">Hech narsa topilmadi.</p>
        ) : (
          renderTable(searchResults, true)
        )
      ) : (
        <div className="space-y-6">
          {groupByLesson(words).map(([lessonLabel, lessonWords]) => (
            <LessonGroup key={lessonLabel} label={lessonLabel} count={lessonWords.length} previewLabel={lessonWords[0]?.english}>
              {renderTable(lessonWords, false)}
            </LessonGroup>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "So'zni tahrirlash" : "Yangi so'z"}>
        <WordForm
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
