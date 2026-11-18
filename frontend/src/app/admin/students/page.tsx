"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { AdminIcon } from "@/components/admin/AdminIcons";

interface Student {
  id: string;
  displayName: string;
  email: string;
  createdAt: string;
  google: boolean;
  lastActiveDate: string | null;
  active: boolean;
  currentStreak: number;
  totalWordsLearned: number;
  textbookAnswers: number;
  textbookExercises: number;
}

interface StudentsResponse {
  total: number;
  page: number;
  pageSize: number;
  students: Student[];
}

const fmtDate = (d: string) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(d));
const avatarColors = ["#7c3aed", "#db2777", "#0891b2", "#ea580c", "#16a34a", "#4f46e5"];

function Avatar({ s }: { s: Student }) {
  const src = s.displayName || s.email || "?";
  const color = avatarColors[[...src].reduce((a, c) => a + c.charCodeAt(0), 0) % avatarColors.length];
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white" style={{ background: color }}>
      {src.slice(0, 1).toUpperCase()}
    </span>
  );
}

function StatusBadge({ s }: { s: Student }) {
  return (
    <span
      className={`whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-bold ${
        s.active ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" : "bg-[#f3effd] text-foreground/50 dark:bg-surface-muted"
      }`}
    >
      {s.active ? "Faol" : "Nofaol"}
    </span>
  );
}

function StudentsContent() {
  const router = useRouter();
  const params = useSearchParams();
  const search = params.get("search") ?? "";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const [input, setInput] = useState(search);
  const [data, setData] = useState<StudentsResponse | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const q = new URLSearchParams({ page: String(page) });
    if (search) q.set("search", search);
    apiFetch<StudentsResponse>(`/admin/students?${q}`, { admin: true })
      .then((d) => {
        setData(d);
        setError(false);
      })
      .catch(() => setError(true));
  }, [search, page]);

  function go(next: { search?: string; page?: number }) {
    const q = new URLSearchParams();
    const s = next.search ?? search;
    if (s) q.set("search", s);
    if ((next.page ?? 1) > 1) q.set("page", String(next.page));
    router.push(`/admin/students${q.toString() ? `?${q}` : ""}`);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    go({ search: input.trim(), page: 1 });
  }

  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="mx-auto max-w-[1180px] space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-sans text-2xl font-extrabold tracking-tight sm:text-3xl">O&apos;quvchilar</h1>
          <p className="text-sm text-foreground/60">{data ? `${data.total} ta o'quvchi` : "…"}</p>
        </div>
        <form onSubmit={onSubmit} className="relative w-full sm:w-80">
          <AdminIcon name="search" className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ism yoki email…"
            className="w-full rounded-full bg-white py-2.5 pl-11 pr-4 text-sm shadow-[0_8px_20px_-16px_rgba(76,29,149,0.5)] outline-none ring-[#7c3aed]/30 focus:ring-2 dark:bg-surface"
          />
        </form>
      </div>

      {error && <p className="rounded-2xl bg-danger-soft p-4 text-sm text-danger">Ro&apos;yxatni yuklab bo&apos;lmadi.</p>}

      {/* desktop table */}
      <div className="hidden overflow-hidden rounded-3xl bg-white shadow-[0_10px_30px_-18px_rgba(76,29,149,0.35)] dark:bg-surface md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#f6f2fe] text-left text-xs font-bold text-foreground/70 dark:bg-surface-muted">
              <th className="px-5 py-3">O&apos;quvchi</th>
              <th className="px-4 py-3">Qo&apos;shilgan</th>
              <th className="px-4 py-3">Oxirgi faollik</th>
              <th className="px-4 py-3 text-right">Streak</th>
              <th className="px-4 py-3 text-right">So&apos;zlar</th>
              <th className="px-4 py-3 text-right">Darslik</th>
              <th className="px-5 py-3">Holat</th>
            </tr>
          </thead>
          <tbody>
            {data?.students.map((s) => (
              <tr key={s.id} className="border-t border-[#f1ebfd] dark:border-border">
                <td className="px-5 py-3">
                  <span className="flex items-center gap-3">
                    <Avatar s={s} />
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{s.displayName || "—"}</span>
                      <span className="block truncate text-xs text-foreground/55">
                        {s.email}
                        {s.google && " · Google"}
                      </span>
                    </span>
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-foreground/65">{fmtDate(s.createdAt)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-foreground/65">{s.lastActiveDate ? fmtDate(s.lastActiveDate) : "—"}</td>
                <td className="px-4 py-3 text-right font-semibold">{s.currentStreak ? `${s.currentStreak} 🔥` : "0"}</td>
                <td className="px-4 py-3 text-right font-semibold">{s.totalWordsLearned}</td>
                <td className="px-4 py-3 text-right text-foreground/70">
                  {s.textbookAnswers + s.textbookExercises}
                </td>
                <td className="px-5 py-3">
                  <StatusBadge s={s} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data && data.students.length === 0 && <p className="py-10 text-center text-foreground/50">Hech kim topilmadi</p>}
      </div>

      {/* phone cards */}
      <div className="space-y-2.5 md:hidden">
        {data?.students.map((s) => (
          <div key={s.id} className="rounded-2xl bg-white p-3.5 shadow-[0_8px_24px_-18px_rgba(76,29,149,0.45)] dark:bg-surface">
            <div className="flex items-center gap-3">
              <Avatar s={s} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{s.displayName || "—"}</p>
                <p className="truncate text-xs text-foreground/55">{s.email}</p>
              </div>
              <StatusBadge s={s} />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-xl bg-[#f6f2fe] py-2 dark:bg-surface-muted">
                <p className="font-extrabold">{s.currentStreak} 🔥</p>
                <p className="text-foreground/55">Streak</p>
              </div>
              <div className="rounded-xl bg-[#f6f2fe] py-2 dark:bg-surface-muted">
                <p className="font-extrabold">{s.totalWordsLearned}</p>
                <p className="text-foreground/55">So&apos;zlar</p>
              </div>
              <div className="rounded-xl bg-[#f6f2fe] py-2 dark:bg-surface-muted">
                <p className="font-extrabold">{s.textbookAnswers + s.textbookExercises}</p>
                <p className="text-foreground/55">Darslik</p>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-foreground/50">Qo&apos;shilgan: {fmtDate(s.createdAt)}</p>
          </div>
        ))}
        {data && data.students.length === 0 && <p className="py-10 text-center text-foreground/50">Hech kim topilmadi</p>}
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => go({ page: page - 1 })}
            className="rounded-full bg-white px-4 py-2 text-sm font-bold disabled:opacity-40 dark:bg-surface"
          >
            ←
          </button>
          <span className="text-sm font-semibold text-foreground/70">
            {page} / {pages}
          </span>
          <button
            disabled={page >= pages}
            onClick={() => go({ page: page + 1 })}
            className="rounded-full bg-white px-4 py-2 text-sm font-bold disabled:opacity-40 dark:bg-surface"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}

export default function AdminStudentsPage() {
  return (
    <Suspense fallback={null}>
      <StudentsContent />
    </Suspense>
  );
}
