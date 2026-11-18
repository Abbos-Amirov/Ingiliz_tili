"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { apiFetch } from "@/lib/api";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { AdminIcon, type AdminIconName } from "@/components/admin/AdminIcons";
import { tf, useAdminT } from "@/hooks/useAdminT";
import type { AdminDict } from "@/lib/i18n/admin";

// Admin dashboard (layout from the Pallo! admin mockup). Every figure comes
// from GET /api/admin/dashboard — real data only; the mockup's revenue,
// rating and class-schedule cards were swapped for metrics this app has.

interface Dashboard {
  totals: {
    students: number;
    newThisMonth: number;
    studentsChange: number | null;
    activeWeek: number;
    activeWeekChange: number | null;
    activeToday: number;
    wordsLearned: number;
    textbookAnswers: number;
    textbookCorrect: number;
  };
  growth: { date: string; total: number }[];
  activity: { key: "words" | "textbook" | "grammar" | "palace"; count: number }[];
  recentStudents: { id: string; displayName: string; email: string; createdAt: string; lastActiveDate: string | null; active: boolean }[];
  topLearners: { displayName: string; email: string; currentStreak: number; totalWordsLearned: number; lastActiveDate: string | null }[];
  content: { words: number; sentences: number; lessons: number; videos: number };
}

const RANGES = [
  { key: "1M", days: 30 },
  { key: "3M", days: 90 },
  { key: "6M", days: 180 },
  { key: "1Y", days: 365 },
] as const;

const ACTIVITY_META: Record<Dashboard["activity"][number]["key"], { labelKey: keyof AdminDict["dashboard"]; color: string }> = {
  words: { labelKey: "actWords", color: "#4c1d95" },
  textbook: { labelKey: "actTextbook", color: "#8b5cf6" },
  grammar: { labelKey: "actGrammar", color: "#c4b5fd" },
  palace: { labelKey: "actPalace", color: "#e9d5ff" },
};

const fmt = new Intl.NumberFormat("en-US");
const fmtDate = (d: string | Date) =>
  new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(d));
const fmtShort = (d: string) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(d));

function Change({ value, suffix = "" }: { value: number | null; suffix?: string }) {
  if (value === null) return <span className="text-xs font-semibold opacity-60">—</span>;
  const up = value >= 0;
  return (
    <span className={`text-xs font-bold ${up ? "text-emerald-500" : "text-rose-500"}`}>
      {up ? "↑" : "↓"} {up ? "+" : ""}
      {value}%{suffix}
    </span>
  );
}

function StatCard({
  icon,
  value,
  label,
  foot,
  highlight,
  delay,
}: {
  icon: AdminIconName;
  value: string;
  label: string;
  foot: React.ReactNode;
  highlight?: boolean;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={`relative overflow-hidden rounded-3xl p-4 sm:p-5 ${
        highlight
          ? "bg-gradient-to-br from-[#5b21b6] to-[#7c3aed] text-white shadow-[0_18px_40px_-18px_rgba(91,33,182,0.8)]"
          : "bg-white text-foreground shadow-[0_10px_30px_-18px_rgba(76,29,149,0.35)] dark:bg-surface"
      }`}
    >
      <div className="flex flex-col items-center gap-2 text-center sm:flex-row sm:items-start sm:gap-3 sm:text-left">
        <span className={highlight ? "text-white" : "text-[#6d28d9] dark:text-primary"}>
          <AdminIcon name={icon} className="h-8 w-8 sm:h-9 sm:w-9" />
        </span>
        <div className="min-w-0">
          <p className="text-2xl font-extrabold leading-tight tracking-tight sm:text-[1.7rem]">{value}</p>
          <p className={`text-xs sm:text-sm ${highlight ? "text-white/80" : "text-foreground/60"}`}>{label}</p>
        </div>
      </div>
      <div className={`mt-2 text-center sm:mt-3 sm:text-right ${highlight ? "[&_span]:!text-white/90" : ""}`}>{foot}</div>
    </motion.div>
  );
}

function GrowthChart({ data }: { data: { date: string; total: number }[] }) {
  const t = useAdminT("dashboard");
  // Down-sample to ≤ 30 points so the line stays smooth on long ranges.
  const pts = useMemo(() => {
    if (data.length <= 30) return data;
    const step = (data.length - 1) / 29;
    return Array.from({ length: 30 }, (_, i) => data[Math.round(i * step)]);
  }, [data]);
  // ~15% headroom so the line never hugs the top edge
  const max = Math.max(4, Math.ceil(Math.max(...pts.map((p) => p.total)) * 1.15));
  // Round tick step (1, 1.5, 2, 2.5, 3, 4, 5, 10 × 10^k) so labels read 0/15/30/45/60.
  const niceMax = (() => {
    const raw = max / 4;
    const mag = 10 ** Math.floor(Math.log10(raw));
    const step = [1, 1.5, 2, 2.5, 3, 4, 5, 10].map((m) => m * mag).find((v) => v >= raw) ?? 10 * mag;
    return Math.max(4, Math.round(step * 4));
  })();
  const W = 600;
  const H = 220;
  const xy = pts.map((p, i) => [(i / Math.max(1, pts.length - 1)) * W, H - (p.total / niceMax) * H] as const);
  const line = xy.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${W},${H} L0,${H} Z`;
  const last = xy[xy.length - 1];
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(niceMax * f));
  const labelIdx = [0, Math.round((pts.length - 1) / 3), Math.round(((pts.length - 1) * 2) / 3), pts.length - 1];

  return (
    <div className="flex gap-2">
      <div className="flex h-[220px] flex-col-reverse justify-between pb-0 text-[11px] text-foreground/45">
        {ticks.map((t) => (
          <span key={t} className="leading-none">
            {t >= 1000 ? `${t / 1000}k` : t}
          </span>
        ))}
      </div>
      <div className="min-w-0 flex-1">
        <div className="relative h-[220px]">
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
            <defs>
              <linearGradient id="growthFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
              </linearGradient>
            </defs>
            {ticks.map((t) => (
              <line key={t} x1="0" x2={W} y1={H - (t / niceMax) * H} y2={H - (t / niceMax) * H} stroke="currentColor" className="text-foreground/10" strokeDasharray="4 6" vectorEffect="non-scaling-stroke" />
            ))}
            <path d={area} fill="url(#growthFill)" />
            <path d={line} fill="none" stroke="#6d28d9" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          </svg>
          {last && (
            <>
              <span
                className="absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-[#6d28d9] bg-white"
                style={{ left: `${(last[0] / W) * 100}%`, top: `${(last[1] / H) * 100}%` }}
              />
              <span
                className={`absolute -translate-x-full whitespace-nowrap rounded-full bg-white px-3 py-1 text-xs font-bold shadow-md dark:bg-surface ${
                  last[1] / H < 0.3 ? "translate-y-[60%]" : "-translate-y-[150%]"
                }`}
                style={{ left: `${(last[0] / W) * 100}%`, top: `${(last[1] / H) * 100}%` }}
              >
                <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-[#6d28d9]" />
                {tf(t.studentsCount, { n: fmt.format(pts[pts.length - 1].total) })}
              </span>
            </>
          )}
        </div>
        <div className="mt-2 flex justify-between text-[11px] text-foreground/50">
          {labelIdx.map((i, k) => (
            <span key={k}>{pts[i] ? fmtShort(pts[i].date) : ""}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Donut({ activity }: { activity: Dashboard["activity"] }) {
  const t = useAdminT("dashboard");
  const total = activity.reduce((s, a) => s + a.count, 0);
  const R = 52;
  const C = 2 * Math.PI * R;
  let offset = 0;
  const top = [...activity].sort((a, b) => b.count - a.count)[0];
  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);
  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:gap-6">
      <div className="relative h-40 w-40 shrink-0">
        <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
          <circle cx="70" cy="70" r={R} fill="none" stroke="#f1ebfd" strokeWidth="22" className="dark:stroke-[#2a1f45]" />
          {total > 0 &&
            activity.map((a) => {
              const len = (a.count / total) * C;
              const el = (
                <circle
                  key={a.key}
                  cx="70"
                  cy="70"
                  r={R}
                  fill="none"
                  stroke={ACTIVITY_META[a.key].color}
                  strokeWidth="22"
                  strokeDasharray={`${len} ${C - len}`}
                  strokeDashoffset={-offset}
                />
              );
              offset += len;
              return el;
            })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-extrabold">{top ? pct(top.count) : 0}%</span>
          <span className="text-[11px] text-foreground/60">{top ? t[ACTIVITY_META[top.key].labelKey] : "—"}</span>
        </div>
      </div>
      <ul className="w-full space-y-2.5">
        {activity.map((a) => (
          <li key={a.key} className="flex items-center gap-2.5 text-sm">
            <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: ACTIVITY_META[a.key].color }} />
            <span className="flex-1 text-foreground/75">{t[ACTIVITY_META[a.key].labelKey]}</span>
            <span className="font-bold">{pct(a.count)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Panel({ title, icon, action, children, className = "" }: { title: string; icon: AdminIconName; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`min-w-0 rounded-3xl bg-white p-4 shadow-[0_10px_30px_-18px_rgba(76,29,149,0.35)] sm:p-6 dark:bg-surface ${className}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2.5 font-sans text-base font-extrabold sm:text-lg">
          <AdminIcon name={icon} className="h-5 w-5 text-[#6d28d9] dark:text-primary" />
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

const avatarColors = ["#7c3aed", "#db2777", "#0891b2", "#ea580c", "#16a34a", "#4f46e5"];
function Avatar({ name, email }: { name: string; email: string }) {
  const src = name || email || "?";
  const color = avatarColors[[...src].reduce((s, c) => s + c.charCodeAt(0), 0) % avatarColors.length];
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: color }}>
      {src.slice(0, 1).toUpperCase()}
    </span>
  );
}

function ViewAll({ href }: { href: string }) {
  const tc = useAdminT("common");
  return (
    <Link href={href} className="flex items-center gap-1 text-sm font-bold text-[#6d28d9] hover:underline dark:text-primary">
      {tc.viewAll} <AdminIcon name="arrowRight" className="h-4 w-4" />
    </Link>
  );
}

export default function AdminDashboardPage() {
  const { user } = useAdminAuth();
  const t = useAdminT("dashboard");
  const tc = useAdminT("common");
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState(false);
  const [range, setRange] = useState<(typeof RANGES)[number]["key"]>("1M");

  useEffect(() => {
    apiFetch<Dashboard>("/admin/dashboard", { admin: true })
      .then(setData)
      .catch(() => setError(true));
  }, []);

  const growth = useMemo(() => {
    if (!data) return [];
    const days = RANGES.find((r) => r.key === range)!.days;
    return data.growth.slice(-days);
  }, [data, range]);

  const name = user?.displayName || "Admin";

  return (
    <div className="mx-auto max-w-[1180px] space-y-5 sm:space-y-6">
      {/* Welcome — plain on desktop, purple card on phones (as in the mockup) */}
      <div className="flex items-start justify-between gap-4">
        <div className="hidden lg:block">
          <h1 className="font-sans text-3xl font-extrabold tracking-tight">{tf(t.welcome, { name })}</h1>
          <p className="mt-1 text-foreground/60">{t.subtitle}</p>
        </div>
        <span className="hidden items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold shadow-[0_8px_20px_-14px_rgba(76,29,149,0.5)] dark:bg-surface lg:inline-flex">
          <AdminIcon name="calendar" className="h-4 w-4 text-foreground/60" />
          {fmtDate(new Date())}
        </span>
      </div>
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#5b21b6] to-[#7c3aed] p-5 text-white lg:hidden">
        <svg viewBox="0 0 100 100" className="pointer-events-none absolute -right-6 -bottom-6 h-36 w-36 opacity-15" aria-hidden>
          <g stroke="white" strokeWidth="22" strokeLinecap="round">
            <line x1="14" y1="50" x2="86" y2="50" />
            <line x1="30" y1="24" x2="70" y2="76" />
            <line x1="70" y1="24" x2="30" y2="76" />
          </g>
        </svg>
        <h1 className="relative font-sans text-2xl font-extrabold leading-tight text-white">{tf(t.welcome, { name })}</h1>
        <p className="relative mt-1 text-sm text-white/80">{t.subtitleShort}</p>
      </div>

      {error && <p className="rounded-2xl bg-danger-soft p-4 text-sm text-danger">{tc.loadError}</p>}

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard
          highlight
          delay={0}
          icon="users"
          value={data ? fmt.format(data.totals.students) : "…"}
          label={t.totalStudents}
          foot={data && <span className="text-xs font-bold">{tf(t.thisMonth, { n: data.totals.newThisMonth })}</span>}
        />
        <StatCard
          delay={0.05}
          icon="activity"
          value={data ? fmt.format(data.totals.activeWeek) : "…"}
          label={t.activeWeek}
          foot={data && <Change value={data.totals.activeWeekChange} />}
        />
        <StatCard
          delay={0.1}
          icon="book"
          value={data ? fmt.format(data.totals.wordsLearned) : "…"}
          label={t.wordsLearned}
          foot={data && <span className="text-xs font-semibold text-foreground/50">{tf(t.activeToday, { n: data.totals.activeToday })}</span>}
        />
        <StatCard
          delay={0.15}
          icon="check"
          value={data ? fmt.format(data.totals.textbookAnswers) : "…"}
          label={t.textbookAnswers}
          foot={
            data && (
              <span className="text-xs font-bold text-emerald-500">
                {tf(t.correctPct, {
                  n: data.totals.textbookAnswers ? Math.round((data.totals.textbookCorrect / data.totals.textbookAnswers) * 100) : 0,
                })}
              </span>
            )
          }
        />
      </div>

      {/* Growth + activity */}
      <div className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">
        <Panel
          title={t.growth}
          icon="trend"
          action={
            <div className="flex gap-1">
              {RANGES.map((r) => (
                <button
                  key={r.key}
                  onClick={() => setRange(r.key)}
                  className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${
                    range === r.key ? "bg-[#5b21b6] text-white" : "text-foreground/60 hover:bg-[#f3effd] dark:hover:bg-surface-muted"
                  }`}
                >
                  {r.key}
                </button>
              ))}
            </div>
          }
        >
          {data ? <GrowthChart data={growth} /> : <div className="h-[240px] animate-pulse rounded-2xl bg-[#f3effd] dark:bg-surface-muted" />}
        </Panel>
        <Panel title={t.activityTitle} icon="grid">
          {data ? <Donut activity={data.activity} /> : <div className="h-40 animate-pulse rounded-2xl bg-[#f3effd] dark:bg-surface-muted" />}
        </Panel>
      </div>

      {/* Recent students + top learners */}
      <div className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">
        <Panel title={t.recentStudents} icon="users" action={<ViewAll href="/admin/students" />}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="bg-[#f6f2fe] text-left text-xs font-bold text-foreground/70 dark:bg-surface-muted">
                  <th className="rounded-l-xl px-3 py-2.5">#</th>
                  <th className="px-3 py-2.5">{t.colName}</th>
                  <th className="px-3 py-2.5">{t.colEmail}</th>
                  <th className="px-3 py-2.5">{t.colJoined}</th>
                  <th className="rounded-r-xl px-3 py-2.5">{t.colStatus}</th>
                </tr>
              </thead>
              <tbody>
                {data?.recentStudents.map((s, i) => (
                  <tr key={s.id} className="border-b border-[#f1ebfd] last:border-0 dark:border-border">
                    <td className="px-3 py-3 text-foreground/50">{i + 1}</td>
                    <td className="px-3 py-3">
                      <span className="flex items-center gap-2.5 font-semibold">
                        <Avatar name={s.displayName} email={s.email} />
                        <span className="truncate">{s.displayName || "—"}</span>
                      </span>
                    </td>
                    <td className="max-w-[180px] truncate px-3 py-3 text-foreground/65">{s.email}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-foreground/65">{fmtDate(s.createdAt)}</td>
                    <td className="px-3 py-3">
                      <span
                        className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                          s.active ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" : "bg-[#f3effd] text-foreground/50 dark:bg-surface-muted"
                        }`}
                      >
                        {s.active ? t.active : t.inactive}
                      </span>
                    </td>
                  </tr>
                ))}
                {data && data.recentStudents.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-foreground/50">
                      {t.noStudents}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title={t.topLearners} icon="flame" action={<ViewAll href="/admin/students" />}>
          <ul className="space-y-2.5">
            {data?.topLearners.map((s, i) => (
              <li key={`${s.email}-${i}`} className="flex items-center gap-3 rounded-2xl border border-[#f1ebfd] p-3 dark:border-border">
                <span className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-[#f3effd] text-[#5b21b6] dark:bg-surface-muted dark:text-primary">
                  <span className="text-lg font-extrabold leading-none">{s.currentStreak}</span>
                  <span className="text-[10px] font-bold">{t.days}</span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{s.displayName || s.email}</p>
                  <p className="truncate text-xs text-foreground/55">{tf(t.wordsLearnedBy, { n: fmt.format(s.totalWordsLearned) })}</p>
                </div>
              </li>
            ))}
            {data && data.topLearners.length === 0 && <p className="py-6 text-center text-sm text-foreground/50">{t.noActive}</p>}
          </ul>
        </Panel>
      </div>

      {/* Content totals */}
      {data && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: t.cWords, value: data.content.words, href: "/admin/words", icon: "book" as const },
            { label: t.cSentences, value: data.content.sentences, href: "/admin/sentences", icon: "pen" as const },
            { label: t.cLessons, value: data.content.lessons, href: "/lessons", icon: "grid" as const },
            { label: t.cVideos, value: data.content.videos, href: "/admin/shadowing", icon: "video" as const },
          ].map((c) => (
            <Link key={c.label} href={c.href} className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-[0_8px_24px_-18px_rgba(76,29,149,0.4)] transition-transform hover:-translate-y-0.5 dark:bg-surface">
              <AdminIcon name={c.icon} className="h-6 w-6 text-[#6d28d9] dark:text-primary" />
              <div>
                <p className="text-lg font-extrabold leading-tight">{fmt.format(c.value)}</p>
                <p className="text-xs text-foreground/55">{c.label}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
