"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import type { ShadowingVideo } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { ShadowingVideoForm } from "@/components/admin/ShadowingVideoForm";

export default function AdminShadowingPage() {
  const [videos, setVideos] = useState<ShadowingVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ShadowingVideo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ videos: ShadowingVideo[] }>("/shadowing", { admin: true });
      setVideos(res.videos);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  async function openEdit(video: ShadowingVideo) {
    setError(null);
    try {
      // The list response omits `transcript` (kept light) — fetch the full
      // record so the editable word table isn't blank.
      const res = await apiFetch<{ video: ShadowingVideo }>(`/shadowing/${video._id}`, { admin: true });
      setEditing(res.video);
      setModalOpen(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Videoni yuklashda xatolik");
    }
  }

  async function handleDelete(video: ShadowingVideo) {
    if (!confirm(`"${video.title}" videosini o'chirishni tasdiqlaysizmi?`)) return;
    setError(null);
    try {
      await apiFetch(`/shadowing/${video._id}`, { method: "DELETE", admin: true });
      setVideos((prev) => prev.filter((v) => v._id !== video._id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "O'chirishda xatolik");
    }
  }

  function formatDuration(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold">Shadowing videolar</h1>
          <p className="text-foreground/60 text-sm mt-1">Jami {videos.length} ta video</p>
        </div>
        <Button onClick={openCreate}>+ Video qo&apos;shish</Button>
      </div>

      {error && <p className="text-danger text-sm mb-4">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
      ) : videos.length === 0 ? (
        <p className="text-center py-16 text-foreground/60">Hali video qo&apos;shilmagan.</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {videos.map((v) => (
            <Card key={v._id} className="p-4 flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold">{v.title}</p>
                <div className="flex gap-2 mt-2">
                  <span className="px-2 py-0.5 rounded-full bg-surface-muted text-xs font-medium">{v.level}</span>
                  <span className="px-2 py-0.5 rounded-full bg-surface-muted text-xs font-medium">
                    {formatDuration(v.duration)}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1 text-sm shrink-0 items-end">
                <button onClick={() => openEdit(v)} className="text-primary font-medium hover:underline">
                  Tahrirlash
                </button>
                <button onClick={() => handleDelete(v)} className="text-danger font-medium hover:underline">
                  O&apos;chirish
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Videoni tahrirlash" : "Yangi Shadowing video"}
      >
        <ShadowingVideoForm
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
