"use client";

import { useRef, useState } from "react";
import { getAdminToken } from "@/lib/auth";
import { apiFetch, ApiError } from "@/lib/api";
import { AdminIcon } from "@/components/admin/AdminIcons";
import { tf, useAdminT } from "@/hooks/useAdminT";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";

// Lesson video in the admin lesson editor: upload (with progress), preview,
// replace, remove. Saved immediately on its own endpoint — independent of
// the editor's Save button.
export function LessonVideoPanel({
  lessonId,
  videoUrl,
  onChange,
}: {
  lessonId: string;
  videoUrl: string;
  onChange: (url: string) => void;
}) {
  const t = useAdminT("tbEditor");
  const fileRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  function upload(file: File) {
    setError(null);
    setProgress(0);
    const form = new FormData();
    form.append("video", file);
    // XHR (not fetch) for upload progress — videos can be large.
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE}/admin/textbook/lessons/${lessonId}/video`);
    const token = getAdminToken();
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.upload.onprogress = (e) => e.lengthComputable && setProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      setProgress(null);
      try {
        const body = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) onChange(body.lesson.videoUrl ?? "");
        else setError(body.error ?? t.videoError);
      } catch {
        setError(t.videoError);
      }
    };
    xhr.onerror = () => {
      setProgress(null);
      setError(t.videoError);
    };
    xhr.send(form);
  }

  async function remove() {
    if (!confirm(t.videoRemoveConfirm)) return;
    try {
      await apiFetch(`/admin/textbook/lessons/${lessonId}/video`, { admin: true, method: "DELETE" });
      onChange("");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t.videoError);
    }
  }

  return (
    <div className="space-y-3">
      <input
        ref={fileRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) upload(f);
        }}
      />
      {videoUrl && progress === null && (
        <video src={videoUrl} controls playsInline className="aspect-video w-full max-w-2xl rounded-2xl bg-black" />
      )}
      {progress !== null ? (
        <div className="max-w-2xl rounded-2xl bg-[#faf7ff] p-4 dark:bg-surface-muted">
          <p className="text-sm font-bold">{tf(t.videoUploading, { p: progress })}</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e7defb] dark:bg-border">
            <div className="h-full rounded-full bg-[#7c3aed] transition-[width]" style={{ width: `${progress}%` }} />
          </div>
        </div>
      ) : videoUrl ? (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-full bg-[#f3effd] px-4 py-2 text-sm font-bold text-[#5b21b6] hover:bg-[#ebe3fd] dark:bg-surface-muted dark:text-[#c4b5fd]"
          >
            <AdminIcon name="upload" className="h-4 w-4" />
            {t.videoReplace}
          </button>
          <button onClick={remove} className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-bold text-danger hover:bg-danger-soft">
            <AdminIcon name="trash" className="h-4 w-4" />
            {t.videoRemove}
          </button>
        </div>
      ) : (
        <button
          onClick={() => fileRef.current?.click()}
          className="flex w-full max-w-2xl flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#d8cbfa] px-4 py-8 text-center transition hover:bg-[#faf7ff] dark:border-border dark:hover:bg-surface-muted"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f3effd] text-[#7c3aed] dark:bg-surface-muted">
            <AdminIcon name="video" className="h-6 w-6" />
          </span>
          <span className="font-bold">{t.videoUpload}</span>
          <span className="text-xs text-foreground/50">{t.videoUploadHint}</span>
        </button>
      )}
      {error && <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
    </div>
  );
}
