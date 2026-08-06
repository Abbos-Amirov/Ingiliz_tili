"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiFetch, ApiError } from "@/lib/api";
import type { IrregularVerb, IrregularVerbCategory } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { IrregularVerbForm } from "@/components/admin/IrregularVerbForm";
import { IRREGULAR_VERB_CATEGORIES, IRREGULAR_VERB_CATEGORY_LABELS } from "@/lib/irregularVerbCategories";

export default function AdminIrregularVerbsPage() {
  const [verbs, setVerbs] = useState<IrregularVerb[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<IrregularVerb | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<IrregularVerbCategory | "">("");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ verbs: IrregularVerb[] }>("/irregular-verbs?limit=500", { admin: true });
      setVerbs(res.verbs);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch-on-mount against the separate Express API.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return verbs.filter((v) => {
      if (categoryFilter && v.category !== categoryFilter) return false;
      if (!q) return true;
      return v.base.includes(q) || v.past.includes(q) || v.participle.includes(q);
    });
  }, [verbs, categoryFilter, search]);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(v: IrregularVerb) {
    setEditing(v);
    setModalOpen(true);
  }

  async function handleDelete(v: IrregularVerb) {
    if (!confirm(`"${v.base}" fe'lini o'chirishni tasdiqlaysizmi?`)) return;
    setError(null);
    try {
      await apiFetch(`/irregular-verbs/${v._id}`, { method: "DELETE", admin: true });
      setVerbs((prev) => prev.filter((x) => x._id !== v._id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "O'chirishda xatolik");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Irregular Verbs</h1>
          <p className="text-foreground/60 text-sm mt-1">Jami {verbs.length} ta fe&apos;l</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/irregular-verbs/upload">
            <Button variant="secondary">📤 CSV yuklash</Button>
          </Link>
          <Button onClick={openCreate}>+ Fe&apos;l qo&apos;shish</Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Qidirish (base/past/participle)..."
          className="rounded-xl border border-border bg-surface-muted px-3.5 py-2 text-sm outline-none focus:ring-2 focus:ring-primary min-w-[220px]"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as IrregularVerbCategory | "")}
          className="rounded-xl border border-border bg-surface-muted px-3.5 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Barcha kategoriyalar</option>
          {IRREGULAR_VERB_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {IRREGULAR_VERB_CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
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
                <th className="px-4 py-3 font-medium">Base</th>
                <th className="px-4 py-3 font-medium">Past</th>
                <th className="px-4 py-3 font-medium">Participle</th>
                <th className="px-4 py-3 font-medium">Koreys</th>
                <th className="px-4 py-3 font-medium">Kategoriya</th>
                <th className="px-4 py-3 font-medium text-right">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => (
                <tr key={v._id} className="border-b border-border last:border-0 hover:bg-surface-muted">
                  <td className="px-4 py-3 font-semibold">{v.base}</td>
                  <td className="px-4 py-3">{v.past}</td>
                  <td className="px-4 py-3">{v.participle}</td>
                  <td className="px-4 py-3">{v.korean}</td>
                  <td className="px-4 py-3 text-foreground/60">{IRREGULAR_VERB_CATEGORY_LABELS[v.category]}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => openEdit(v)} className="text-primary font-medium hover:underline">
                      Tahrirlash
                    </button>
                    <button onClick={() => handleDelete(v)} className="text-danger font-medium hover:underline">
                      O&apos;chirish
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-foreground/50">
                    Hech narsa topilmadi
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
        title={editing ? "Fe'lni tahrirlash" : "Yangi irregular verb"}
      >
        <IrregularVerbForm
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
