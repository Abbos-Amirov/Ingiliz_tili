"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { AdminIcon } from "@/components/admin/AdminIcons";
import { tf, useAdminT } from "@/hooks/useAdminT";
import { shrinkImage } from "@/lib/imageCompression";
import type { AdminBook, ImportJob } from "@/lib/adminTextbook";

const card =
  "rounded-3xl bg-white p-5 shadow-[0_10px_30px_-18px_rgba(76,29,149,0.35)] dark:bg-surface sm:p-6";
const input =
  "w-full rounded-xl border border-[#e7defb] bg-white px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#7c3aed]/30 dark:border-border dark:bg-surface-muted";
const primaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-full bg-[#7c3aed] px-6 py-3 text-sm font-bold text-white shadow-[0_10px_20px_-12px_rgba(124,58,237,0.9)] transition hover:bg-[#6d28d9] disabled:cursor-not-allowed disabled:opacity-50";

interface Photo {
  id: string;
  file: File;
  url: string;
}

type Phase = "form" | "uploading" | "running" | "done" | "failed";

function fmtElapsed(ms: number) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function ImportContent() {
  const t = useAdminT("tbImport");
  const router = useRouter();
  const params = useSearchParams();
  const [books, setBooks] = useState<AdminBook[] | null>(null);
  const [level, setLevel] = useState(params.get("level") ?? "0");
  const [lessonNumber, setLessonNumber] = useState(params.get("lesson") ?? "1");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [phase, setPhase] = useState<Phase>(
    params.get("job") ? "running" : "form"
  );
  const [job, setJob] = useState<ImportJob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const fileRef = useRef<HTMLInputElement>(null);
  const jobId = params.get("job");

  useEffect(() => {
    apiFetch<{ books: AdminBook[] }>("/admin/textbook/books", { admin: true })
      .then((d) => setBooks(d.books))
      .catch(() => setBooks([]));
  }, []);

  // Release the preview object URLs when the page goes away.
  const photosRef = useRef(photos);
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);
  useEffect(
    () => () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.url)),
    []
  );

  // Poll the running import (jobId is in the URL so a refresh resumes it).
  useEffect(() => {
    if (!jobId) return;
    let stop = false;
    const tick = async () => {
      try {
        const { job } = await apiFetch<{ job: ImportJob }>(
          `/admin/textbook/import/${jobId}`,
          { admin: true }
        );
        if (stop) return;
        setJob(job);
        if (job.status === "done" && job.lessonId) {
          setPhase("done");
          router.replace(`/admin/textbooks/lessons/${job.lessonId}?new=1`);
          return;
        }
        if (job.status === "failed") {
          setPhase("failed");
          setError(job.error);
          return;
        }
        setPhase("running");
      } catch (e) {
        if (stop) return;
        setPhase("failed");
        setError(e instanceof ApiError ? e.message : String(e));
        return;
      }
      if (!stop) setTimeout(tick, 3000);
    };
    void tick();
    return () => {
      stop = true;
    };
  }, [jobId, router]);

  useEffect(() => {
    if (phase !== "running" && phase !== "uploading") return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [phase]);

  const book = books?.find((b) => String(b.level) === level);
  const exists = book?.lessons.some(
    (l) => String(l.lessonNumber) === lessonNumber.trim()
  );

  function addFiles(list: FileList | File[]) {
    const imgs = [...list].filter((f) => f.type.startsWith("image/"));
    setPhotos((prev) =>
      [
        ...prev,
        ...imgs.map((file) => ({
          id: `${file.name}-${file.size}-${Math.random()}`,
          file,
          url: URL.createObjectURL(file),
        })),
      ].slice(0, 12)
    );
  }

  function move(i: number, d: -1 | 1) {
    setPhotos((prev) => {
      const next = [...prev];
      const j = i + d;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  function remove(i: number) {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[i].url);
      return prev.filter((_, k) => k !== i);
    });
  }

  async function start() {
    if (!photos.length) {
      setError(t.needPhotos);
      return;
    }
    setError(null);
    setPhase("uploading");
    setNow(Date.now());
    try {
      const form = new FormData();
      form.append("level", level);
      form.append("lessonNumber", lessonNumber.trim());
      for (const [i, p] of photos.entries())
        form.append(
          "images",
          await shrinkImage(p.file, 2000, 0.85),
          `page-${i + 1}.jpg`
        );
      const { job } = await apiFetch<{ job: ImportJob }>(
        "/admin/textbook/import",
        { admin: true, method: "POST", body: form }
      );
      setJob(job);
      router.replace(`/admin/textbooks/import?job=${job.id}`);
    } catch (e) {
      setPhase("form");
      setError(e instanceof ApiError ? e.message : String(e));
    }
  }

  const startedAt = job ? new Date(job.startedAt).getTime() : now;
  const elapsed = Math.max(0, now - startedAt);
  const step =
    phase === "uploading" ? 0 : phase === "done" ? 3 : elapsed < 45_000 ? 1 : 2;
  const steps = useMemo(() => [t.phase1, t.phase2, t.phase3, t.phase4], [t]);

  // ─── progress / result view ───
  if (phase !== "form") {
    return (
      <div className="mx-auto max-w-xl space-y-5">
        <BackLink />
        <div className={`${card} text-center`}>
          {phase === "failed" ? (
            <>
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-danger-soft text-danger">
                <AdminIcon name="alert" className="h-7 w-7" />
              </span>
              <h1 className="mt-4 font-sans text-xl font-extrabold">
                {t.failed}
              </h1>
              {error && (
                <p className="mt-2 text-sm text-foreground/65">{error}</p>
              )}
              <button
                className={`${primaryBtn} mt-5`}
                onClick={() => {
                  setPhase("form");
                  setJob(null);
                  router.replace(
                    `/admin/textbooks/import?level=${
                      job?.level ?? level
                    }&lesson=${job?.lessonNumber ?? lessonNumber}`
                  );
                }}
              >
                {t.tryAgain}
              </button>
            </>
          ) : (
            <>
              <span className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4c1d95] to-[#7c3aed] text-white">
                <AdminIcon name="sparkles" className="h-8 w-8 animate-pulse" />
              </span>
              <h1 className="mt-4 font-sans text-xl font-extrabold">
                {phase === "done" ? t.done : t.running}
              </h1>
              {job && (
                <p className="mt-1 text-sm font-semibold text-[#6d28d9] dark:text-[#c4b5fd]">
                  {tf(t.jobLine, {
                    level: job.level,
                    n: job.lessonNumber,
                    p: job.pages,
                  })}
                </p>
              )}
              <ol className="mx-auto mt-6 max-w-xs space-y-3 text-left">
                {steps.map((s, i) => (
                  <li key={s} className="flex items-center gap-3 text-sm">
                    {i < step ? (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white">
                        <AdminIcon name="check" className="h-3.5 w-3.5" />
                      </span>
                    ) : i === step ? (
                      <span
                        className="h-6 w-6 animate-spin rounded-full"
                        style={{
                          border: "3px solid #7c3aed",
                          borderTopColor: "transparent",
                        }}
                      />
                    ) : (
                      <span className="h-6 w-6 rounded-full border-2 border-[#e7defb] dark:border-border" />
                    )}
                    <span
                      className={
                        i <= step ? "font-semibold" : "text-foreground/45"
                      }
                    >
                      {s}
                    </span>
                  </li>
                ))}
              </ol>
              <p className="mt-6 text-sm font-bold tabular-nums">
                {tf(t.elapsed, { t: fmtElapsed(elapsed) })}
              </p>
              <p className="mx-auto mt-2 max-w-sm text-xs text-foreground/55">
                {t.runningHint}
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  // ─── form ───
  return (
    <div className="mx-auto max-w-[900px] space-y-5">
      <BackLink />
      <div>
        <h1 className="font-sans text-2xl font-extrabold tracking-tight sm:text-3xl">
          {t.title}
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-foreground/60">
          {t.subtitle}
        </p>
      </div>

      {/* 1. which lesson */}
      <section className={card}>
        <h2 className="font-sans text-lg font-extrabold">{t.stepWhere}</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_180px]">
          <label className="text-xs font-bold text-foreground/60">
            {t.book}
            <select
              className={`${input} mt-1`}
              value={level}
              onChange={(e) => {
                setLevel(e.target.value);
                const b = books?.find(
                  (x) => String(x.level) === e.target.value
                );
                setLessonNumber(
                  String(
                    Math.max(
                      0,
                      ...(b?.lessons.map((l) => l.lessonNumber) ?? [])
                    ) + 1
                  )
                );
              }}
            >
              {books?.map((b) => (
                <option key={b.level} value={b.level}>
                  Lv.{b.level} — {b.title}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-bold text-foreground/60">
            {t.lessonNumber}
            <input
              className={`${input} mt-1`}
              type="number"
              min={1}
              value={lessonNumber}
              onChange={(e) => setLessonNumber(e.target.value)}
            />
          </label>
        </div>
        {exists && (
          <p className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
            <AdminIcon name="alert" className="mt-0.5 h-4 w-4 shrink-0" />
            {tf(t.lessonExists, { n: lessonNumber })}
          </p>
        )}
      </section>

      {/* 2. photos */}
      <section className={card}>
        <h2 className="font-sans text-lg font-extrabold">{t.stepPhotos}</h2>
        <div className="mt-4 grid gap-5 lg:grid-cols-[1fr_260px]">
          <div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                addFiles(e.dataTransfer.files);
              }}
              className={`flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-10 text-center transition ${
                dragOver
                  ? "border-[#7c3aed] bg-[#f3effd]"
                  : "border-[#d8cbfa] hover:bg-[#faf7ff] dark:border-border dark:hover:bg-surface-muted"
              }`}
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f3effd] text-[#7c3aed] dark:bg-surface-muted">
                <AdminIcon name="upload" className="h-6 w-6" />
              </span>
              <span className="font-bold">{t.drop}</span>
              <span className="text-xs text-foreground/50">{t.dropHint}</span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) addFiles(e.target.files);
                e.target.value = "";
              }}
            />

            {photos.length > 0 && (
              <ol className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {photos.map((p, i) => (
                  <li
                    key={p.id}
                    className="overflow-hidden rounded-2xl border border-[#efe9fc] bg-[#faf7ff] dark:border-border dark:bg-surface-muted"
                  >
                    <div className="relative aspect-[3/4]">
                      <Image
                        src={p.url}
                        alt=""
                        fill
                        unoptimized
                        className="object-cover"
                      />
                      <span className="absolute left-2 top-2 rounded-lg bg-black/65 px-2 py-0.5 text-xs font-bold text-white">
                        {tf(t.page, { n: i + 1 })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between px-1.5 py-1">
                      <button
                        onClick={() => move(i, -1)}
                        disabled={i === 0}
                        title={t.moveLeft}
                        className="rounded-lg p-1.5 text-foreground/60 hover:bg-white disabled:opacity-25 dark:hover:bg-surface"
                      >
                        <AdminIcon name="arrowLeft" className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => remove(i)}
                        title={t.remove}
                        className="rounded-lg p-1.5 text-danger hover:bg-white dark:hover:bg-surface"
                      >
                        <AdminIcon name="trash" className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => move(i, 1)}
                        disabled={i === photos.length - 1}
                        title={t.moveRight}
                        className="rounded-lg p-1.5 text-foreground/60 hover:bg-white disabled:opacity-25 dark:hover:bg-surface"
                      >
                        <AdminIcon name="arrowRight" className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <aside className="rounded-2xl bg-[#faf7ff] p-4 text-sm dark:bg-surface-muted">
            <p className="font-bold">💡 {t.tipsTitle}</p>
            <ul className="mt-2 space-y-2 text-foreground/70">
              {[t.tip1, t.tip2, t.tip3, t.tip4].map((tip) => (
                <li key={tip} className="flex gap-2">
                  <AdminIcon
                    name="check"
                    className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                  />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>

      {/* 3. go */}
      <section className={card}>
        <h2 className="font-sans text-lg font-extrabold">{t.stepGo}</h2>
        <p className="mt-1 text-sm text-foreground/60">{t.costNote}</p>
        {error && (
          <p className="mt-3 rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}
        <button
          className={`${primaryBtn} mt-4 w-full sm:w-auto`}
          onClick={start}
          disabled={!photos.length || exists || !books?.length}
        >
          <AdminIcon name="sparkles" className="h-4 w-4" />
          {t.start}
          {photos.length > 0 && ` (${photos.length})`}
        </button>
      </section>
    </div>
  );
}

function BackLink() {
  const t = useAdminT("tbImport");
  return (
    <Link
      href="/admin/textbooks"
      className="inline-flex items-center gap-1.5 text-sm font-bold text-[#6d28d9] hover:underline dark:text-[#c4b5fd]"
    >
      <AdminIcon name="arrowLeft" className="h-4 w-4" />
      {t.back}
    </Link>
  );
}

export default function AdminTextbookImportPage() {
  return (
    <Suspense fallback={null}>
      <ImportContent />
    </Suspense>
  );
}
