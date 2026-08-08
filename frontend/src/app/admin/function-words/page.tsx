"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import type { FunctionWord, FunctionWordCategory } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { FunctionWordForm } from "@/components/admin/FunctionWordForm";

const CATEGORY_LABELS: Record<FunctionWordCategory, string> = {
  preposition: "Predloglar",
  article: "Artikllar",
  question_word: "So'roq so'zlari",
  infinitive_marker: "Infinitive belgisi",
};

const CATEGORY_ORDER: FunctionWordCategory[] = ["preposition", "article", "question_word", "infinitive_marker"];

function groupByCategory(words: FunctionWord[]): [FunctionWordCategory, FunctionWord[]][] {
  const map = new Map<FunctionWordCategory, FunctionWord[]>();
  for (const w of words) {
    const list = map.get(w.category) ?? [];
    list.push(w);
    map.set(w.category, list);
  }
  return CATEGORY_ORDER.filter((c) => map.has(c)).map((c) => [c, map.get(c)!]);
}

export default function AdminFunctionWordsPage() {
  const [words, setWords] = useState<FunctionWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FunctionWord | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ functionWords: FunctionWord[] }>("/function-words", { admin: true });
      setWords(res.functionWords);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function handleDelete(word: FunctionWord) {
    if (!confirm("Bu so'zni o'chirishni tasdiqlaysizmi?")) return;
    setError(null);
    try {
      await apiFetch(`/function-words/${word._id}`, { method: "DELETE", admin: true });
      setWords((prev) => prev.filter((w) => w._id !== word._id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "O'chirishda xatolik");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold">Kichik so&apos;zlar</h1>
          <p className="text-foreground/60 text-sm mt-1">Jami {words.length} ta so&apos;z</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        >
          + So&apos;z qo&apos;shish
        </Button>
      </div>

      {error && <p className="text-danger text-sm mb-4">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {groupByCategory(words).map(([category, categoryWords]) => (
            <div key={category}>
              <h2 className="font-bold text-sm text-foreground/60 mb-2 uppercase tracking-wide">
                {CATEGORY_LABELS[category]} ({categoryWords.length})
              </h2>
              <div className="space-y-3">
                {categoryWords.map((w) => (
                  <Card key={w._id} className="p-4 flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold mb-1">
                        {w.word} {w.korean && <span className="text-foreground/50 font-normal">— {w.korean}</span>}
                      </p>
                      {w.simpleExplanation && (
                        <p className="text-sm text-foreground/70 max-w-xl">{w.simpleExplanation}</p>
                      )}
                      <div className="flex gap-3 mt-1.5 text-xs text-foreground/40">
                        <span>{w.usageTypes.length} ta ishlatilish turi</span>
                        <span>{w.commonMistakes.length} ta xato misoli</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 text-sm shrink-0">
                      <button
                        onClick={() => {
                          setEditing(w);
                          setModalOpen(true);
                        }}
                        className="text-primary font-medium hover:underline"
                      >
                        Tahrirlash
                      </button>
                      <button onClick={() => handleDelete(w)} className="text-danger font-medium hover:underline">
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "So'zni tahrirlash" : "Yangi so'z"}>
        <FunctionWordForm
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
