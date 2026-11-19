"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { apiFetch, ApiError } from "@/lib/api";
import { AdminIcon, type AdminIconName } from "@/components/admin/AdminIcons";
import { tf, useAdminT } from "@/hooks/useAdminT";
import type { AdminBook, AdminLessonSummary } from "@/lib/adminTextbook";
import { shrinkImage } from "@/lib/imageCompression";

const card =
  "rounded-3xl bg-white shadow-[0_10px_30px_-18px_rgba(76,29,149,0.35)] dark:bg-surface";
const input =
  "w-full rounded-xl border border-[#e7defb] bg-white px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#7c3aed]/30 dark:border-border dark:bg-surface-muted";
const primaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-full bg-[#7c3aed] px-5 py-2.5 text-sm font-bold text-white shadow-[0_10px_20px_-12px_rgba(124,58,237,0.9)] transition hover:bg-[#6d28d9] disabled:opacity-50";
const ghostBtn =
  "inline-flex items-center justify-center gap-2 rounded-full bg-[#f3effd] px-4 py-2 text-sm font-bold text-[#5b21b6] transition hover:bg-[#ebe3fd] disabled:opacity-50 dark:bg-surface-muted dark:text-[#c4b5fd]";

export default function AdminTextbooksPage() {
  const t = useAdminT("textbooks");
  const common = useAdminT("common");
  const [books, setBooks] = useState<AdminBook[] | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    apiFetch<{ books: AdminBook[] }>("/admin/textbook/books", { admin: true })
      .then((d) => {
        setBooks(d.books);
        setError(false);
      })
      .catch(() => setError(true));
  }, []);

  useEffect(load, [load]);

  // While an AI import is running, refresh every few seconds so the new
  // draft shows up on its own.
  const importing = books?.some((b) => b.importing.length > 0);
  useEffect(() => {
    if (!importing) return;
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, [importing, load]);

  return (
    <div className="mx-auto max-w-[1180px] space-y-6">
      <div>
        <h1 className="font-sans text-2xl font-extrabold tracking-tight sm:text-3xl">
          {t.title}
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-foreground/60">
          {t.subtitle}
        </p>
      </div>

      <HowItWorks />

      {error && (
        <p className="rounded-2xl bg-danger-soft p-4 text-sm text-danger">
          {common.loadError}
        </p>
      )}
      {!books && !error && <div className={`${card} h-48 animate-pulse`} />}

      {books?.map((b) => (
        <BookCard key={b.level} book={b} onChange={load} />
      ))}

      {books && <AddBook existing={books.map((b) => b.level)} onAdded={load} />}
    </div>
  );
}

function HowItWorks() {
  const t = useAdminT("textbooks");
  const steps: { icon: AdminIconName; title: string; text: string }[] = [
    { icon: "image", title: t.step1, text: t.step1Text },
    { icon: "sparkles", title: t.step2, text: t.step2Text },
    { icon: "check", title: t.step3, text: t.step3Text },
  ];
  return (
    <section className="rounded-3xl bg-gradient-to-br from-[#4c1d95] to-[#7c3aed] p-5 text-white sm:p-6">
      <p className="text-sm font-bold uppercase tracking-wider text-white/70">
        {t.howTitle}
      </p>
      <ol className="mt-4 grid gap-3 sm:grid-cols-3">
        {steps.map((s, i) => (
          <li key={s.title} className="flex gap-3 rounded-2xl bg-white/10 p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
              <AdminIcon name={s.icon} className="h-5 w-5" />
            </span>
            <span>
              <span className="block font-bold">
                {i + 1}. {s.title}
              </span>
              <span className="mt-0.5 block text-sm text-white/75">
                {s.text}
              </span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function BookCard({
  book,
  onChange,
}: {
  book: AdminBook;
  onChange: () => void;
}) {
  const t = useAdminT("textbooks");
  const common = useAdminT("common");
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(book.title);
  const [subtitle, setSubtitle] = useState(book.subtitle);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function saveBook(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await apiFetch(`/admin/textbook/books/${book.level}`, {
        admin: true,
        method: "PUT",
        body: JSON.stringify({ title, subtitle }),
      });
      setEditing(false);
      onChange();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : common.saveError);
    } finally {
      setBusy(false);
    }
  }

  async function uploadCover(file: File) {
    setBusy(true);
    setErr(null);
    try {
      const form = new FormData();
      form.append("image", await shrinkImage(file, 900, 0.85), "cover.jpg");
      await apiFetch(`/admin/textbook/books/${book.level}/cover`, {
        admin: true,
        method: "POST",
        body: form,
      });
      onChange();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : common.saveError);
    } finally {
      setBusy(false);
    }
  }

  async function deleteBook() {
    if (!confirm(t.deleteBookConfirm)) return;
    try {
      await apiFetch(`/admin/textbook/books/${book.level}`, {
        admin: true,
        method: "DELETE",
      });
      onChange();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : common.deleteError);
    }
  }

  const nextNumber =
    Math.max(
      0,
      ...book.lessons.map((l) => l.lessonNumber),
      ...book.importing.map((j) => j.lessonNumber)
    ) + 1;

  return (
    <section className={`${card} overflow-hidden`}>
      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:p-6">
        {/* cover */}
        <div className="flex shrink-0 flex-row items-center gap-4 sm:w-36 sm:flex-col sm:items-stretch">
          <div className="relative aspect-[3/4] w-24 overflow-hidden rounded-2xl bg-[#f3effd] shadow-[0_12px_24px_-16px_rgba(76,29,149,0.7)] dark:bg-surface-muted sm:w-full">
            {book.coverUrl ? (
              <Image
                src={book.coverUrl}
                alt={book.title}
                fill
                unoptimized
                className="object-cover"
              />
            ) : (
              <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-xs font-semibold text-foreground/40">
                <AdminIcon name="image" className="h-6 w-6" />
                {t.noCover}
              </span>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) void uploadCover(f);
            }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className={`${ghostBtn} text-xs`}
          >
            <AdminIcon name="image" className="h-4 w-4" />
            {busy ? t.coverUploading : t.changeCover}
          </button>
        </div>

        {/* details + lessons */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            {editing ? (
              <form
                onSubmit={saveBook}
                className="grid w-full gap-2 sm:max-w-md"
              >
                <label className="text-xs font-bold text-foreground/60">
                  {t.bookTitle}
                  <input
                    className={`${input} mt-1`}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </label>
                <label className="text-xs font-bold text-foreground/60">
                  {t.bookSubtitle}
                  <input
                    className={`${input} mt-1`}
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                  />
                </label>
                <div className="flex gap-2">
                  <button className={primaryBtn} disabled={busy}>
                    {common.save}
                  </button>
                  <button
                    type="button"
                    className={ghostBtn}
                    onClick={() => setEditing(false)}
                  >
                    {common.cancel}
                  </button>
                </div>
              </form>
            ) : (
              <div className="min-w-0">
                <span className="inline-block rounded-lg bg-[#f3effd] px-2 py-0.5 text-xs font-extrabold text-[#6d28d9] dark:bg-surface-muted dark:text-[#c4b5fd]">
                  Lv.{book.level}
                </span>
                <h2 className="mt-1.5 font-sans text-xl font-extrabold">
                  {book.title}
                </h2>
                <p className="text-sm text-foreground/55">
                  {book.subtitle && `${book.subtitle} · `}
                  {tf(t.lessons, { n: book.lessons.length })}
                </p>
              </div>
            )}
            {!editing && (
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setEditing(true)} className={ghostBtn}>
                  <AdminIcon name="pen" className="h-4 w-4" />
                  {t.editBook}
                </button>
                <Link
                  href={`/admin/textbooks/import?level=${book.level}&lesson=${nextNumber}`}
                  className={primaryBtn}
                >
                  <AdminIcon name="sparkles" className="h-4 w-4" />
                  {t.newLesson}
                </Link>
              </div>
            )}
          </div>

          {err && (
            <p className="mt-3 rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">
              {err}
            </p>
          )}

          <ul className="mt-4 space-y-2">
            {book.lessons.map((l) => (
              <LessonRow key={l._id} lesson={l} />
            ))}
            {book.importing.map((j) => (
              <li
                key={j.id}
                className="flex items-center gap-3 rounded-2xl border border-dashed border-[#c4b5fd] bg-[#faf7ff] px-4 py-3 text-sm font-semibold text-[#5b21b6] dark:bg-surface-muted dark:text-[#c4b5fd]"
              >
                <span
                  className="h-4 w-4 animate-spin rounded-full"
                  style={{
                    border: "2px solid #7c3aed",
                    borderTopColor: "transparent",
                  }}
                />
                {tf(t.importing, { n: j.lessonNumber })}
              </li>
            ))}
          </ul>

          {book.lessons.length === 0 && book.importing.length === 0 && (
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#faf7ff] px-4 py-4 text-sm text-foreground/60 dark:bg-surface-muted">
              {t.noLessons}
              {book.level > 3 && (
                <button
                  onClick={deleteBook}
                  className="text-xs font-bold text-danger hover:underline"
                >
                  {t.deleteBook}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function LessonRow({ lesson: l }: { lesson: AdminLessonSummary }) {
  const t = useAdminT("textbooks");
  const common = useAdminT("common");
  const published = l.status === "published";
  return (
    <li>
      <Link
        href={`/admin/textbooks/lessons/${l._id}`}
        className="group flex items-center gap-3 rounded-2xl border border-[#efe9fc] px-4 py-3 transition hover:border-[#c4b5fd] hover:bg-[#faf7ff] dark:border-border dark:hover:bg-surface-muted"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f3effd] text-sm font-extrabold text-[#6d28d9] dark:bg-surface-muted dark:text-[#c4b5fd]">
          {l.lessonNumber}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-bold">{l.title}</span>
          <span className="block truncate text-xs text-foreground/55">
            {tf(common.lesson, { n: l.lessonNumber })}
            {l.titleUz && ` · ${l.titleUz}`}
            <span className="hidden sm:inline">
              {" "}
              ·{" "}
              {tf(t.counts, {
                k: l.counts.keywords,
                p: l.counts.puzzles,
                q: l.counts.questions,
              })}
            </span>
          </span>
        </span>
        <span className="hidden flex-wrap items-center justify-end gap-1.5 sm:flex">
          {l.source === "ai" && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-[#f3effd] px-2 py-1 text-[11px] font-bold text-[#6d28d9] dark:bg-surface-muted dark:text-[#c4b5fd]">
              <AdminIcon name="sparkles" className="h-3 w-3" />
              {t.aiMade}
            </span>
          )}
          {l.warnings > 0 && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-amber-100 px-2 py-1 text-[11px] font-bold text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
              <AdminIcon name="alert" className="h-3 w-3" />
              {tf(t.toCheck, { n: l.warnings })}
            </span>
          )}
        </span>
        <span
          className={`shrink-0 whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-bold ${
            published
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
              : "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"
          }`}
          title={published ? t.published : t.draft}
        >
          {published ? t.published : t.draftShort}
        </span>
        <AdminIcon
          name="arrowRight"
          className="h-4 w-4 shrink-0 text-foreground/30 group-hover:text-[#7c3aed]"
        />
      </Link>
    </li>
  );
}

function AddBook({
  existing,
  onAdded,
}: {
  existing: number[];
  onAdded: () => void;
}) {
  const t = useAdminT("textbooks");
  const common = useAdminT("common");
  const [open, setOpen] = useState(false);
  const [level, setLevel] = useState(String(Math.max(-1, ...existing) + 1));
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      await apiFetch("/admin/textbook/books", {
        admin: true,
        method: "POST",
        body: JSON.stringify({ level: Number(level), title, subtitle }),
      });
      setOpen(false);
      setTitle("");
      setSubtitle("");
      onAdded();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : common.saveError);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-[#d8cbfa] py-5 text-sm font-bold text-[#6d28d9] transition hover:bg-[#faf7ff] dark:border-border dark:text-[#c4b5fd] dark:hover:bg-surface"
      >
        <AdminIcon name="plus" className="h-4 w-4" />
        {t.addBook}
      </button>
    );
  }
  return (
    <form
      onSubmit={submit}
      className={`${card} grid gap-3 p-5 sm:grid-cols-[110px_1fr_1fr_auto] sm:items-end`}
    >
      <p className="text-sm text-foreground/60 sm:col-span-4">
        {t.addBookHint}
      </p>
      <label className="text-xs font-bold text-foreground/60">
        {t.level}
        <input
          className={`${input} mt-1`}
          type="number"
          min={0}
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          required
        />
      </label>
      <label className="text-xs font-bold text-foreground/60">
        {t.bookTitle}
        <input
          className={`${input} mt-1`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </label>
      <label className="text-xs font-bold text-foreground/60">
        {t.bookSubtitle}
        <input
          className={`${input} mt-1`}
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
        />
      </label>
      <div className="flex gap-2">
        <button className={primaryBtn}>{t.create}</button>
        <button
          type="button"
          className={ghostBtn}
          onClick={() => setOpen(false)}
        >
          {common.cancel}
        </button>
      </div>
      {err && <p className="text-sm text-danger sm:col-span-4">{err}</p>}
    </form>
  );
}
