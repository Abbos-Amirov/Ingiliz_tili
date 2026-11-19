"use client";

import { FormEvent, ReactNode, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { AdminIcon, type AdminIconName } from "@/components/admin/AdminIcons";
import { Asterisk } from "@/components/ui/Shapes";
import { AdminLangToggle } from "@/components/admin/AdminLangToggle";
import { useAdminT } from "@/hooks/useAdminT";
import type { AdminDict } from "@/lib/i18n/admin";

// Admin shell, following the Pallo! admin mockup: purple sidebar + light
// content area on desktop; top bar + bottom tab bar + slide-up "more" sheet
// on phones.

const navLinks: { href: string; labelKey: keyof AdminDict["shell"]; icon: AdminIconName }[] = [
  { href: "/admin", labelKey: "dashboard", icon: "home" },
  { href: "/admin/students", labelKey: "students", icon: "users" },
  { href: "/admin/textbooks", labelKey: "textbooks", icon: "library" },
  { href: "/admin/words", labelKey: "words", icon: "book" },
  { href: "/admin/words/upload", labelKey: "csvUpload", icon: "upload" },
  { href: "/admin/sentences", labelKey: "sentences", icon: "pen" },
  { href: "/admin/irregular-verbs", labelKey: "irregularVerbs", icon: "repeat" },
  { href: "/admin/grammar", labelKey: "grammar", icon: "ruler" },
  { href: "/admin/function-words", labelKey: "functionWords", icon: "type" },
  { href: "/admin/questions-answers", labelKey: "questionsAnswers", icon: "chat" },
  { href: "/admin/shadowing", labelKey: "shadowing", icon: "video" },
];

// Phone bottom bar: the most-used four + "More" (opens the full list).
const mobileTabs = ["/admin", "/admin/students", "/admin/textbooks", "/admin/words"];

function isActiveHref(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  if (pathname === href) return true;
  // a deeper nav entry (e.g. /admin/words/upload) wins over its parent
  const deeper = navLinks.some((l) => l.href !== href && l.href.startsWith(`${href}/`) && pathname.startsWith(l.href));
  return !deeper && pathname.startsWith(`${href}/`);
}

function initials(name: string | undefined, email: string | undefined): string {
  const src = (name || email || "A").trim();
  return src.slice(0, 1).toUpperCase();
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, ready, logout } = useAdminAuth();
  const isLoginPage = pathname === "/admin/login";
  const [collapsed, setCollapsed] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const t = useAdminT("shell");
  const tc = useAdminT("common");

  useEffect(() => {
    if (ready && !user && !isLoginPage) router.replace("/admin/login");
  }, [ready, user, isLoginPage, router]);

  useEffect(() => {
    // close overlays on navigation
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMoreOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  if (isLoginPage) return <>{children}</>;
  if (!ready || !user) return null;

  function handleLogout() {
    logout();
    router.push("/admin/login");
  }

  function onSearch(e: FormEvent) {
    e.preventDefault();
    const q = search.trim();
    router.push(q ? `/admin/students?search=${encodeURIComponent(q)}` : "/admin/students");
  }

  const avatar = (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#7c3aed] to-[#4c1d95] text-sm font-bold text-white ring-2 ring-white">
      {initials(user.displayName, user.email)}
    </span>
  );

  return (
    <div className="min-h-screen bg-[#f3effd] dark:bg-background lg:p-4">
      <div className="flex min-h-screen lg:min-h-[calc(100vh-2rem)] lg:overflow-hidden lg:rounded-[28px] lg:shadow-[0_30px_80px_-40px_rgba(76,29,149,0.45)]">
        {/* ───────── Desktop sidebar ───────── */}
        <aside
          className={`relative hidden shrink-0 flex-col bg-gradient-to-b from-[#4c1d95] to-[#6d28d9] text-white transition-[width] duration-300 lg:flex ${
            collapsed ? "w-[84px]" : "w-60"
          }`}
        >
          <Link href="/admin" className="flex flex-col items-center gap-1.5 px-4 pt-8 pb-7" aria-label="PALLO! admin">
            <Asterisk size={collapsed ? 34 : 46} color="#ffffff" />
            {!collapsed && <span className="text-xl font-extrabold tracking-tight">PALLO!</span>}
          </Link>

          <nav className="flex-1 space-y-1 px-3">
            {navLinks.map((l) => {
              const active = isActiveHref(pathname, l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  title={collapsed ? t[l.labelKey] : undefined}
                  className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                    active ? "bg-white/15 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]" : "text-white/75 hover:bg-white/10 hover:text-white"
                  } ${collapsed ? "justify-center" : ""}`}
                >
                  <AdminIcon name={l.icon} className="h-5 w-5 shrink-0" />
                  {!collapsed && <span className="truncate">{t[l.labelKey]}</span>}
                </Link>
              );
            })}
          </nav>

          <div className="px-3 pt-4">
            <button
              onClick={handleLogout}
              className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-white/75 hover:bg-white/10 hover:text-white ${
                collapsed ? "justify-center" : ""
              }`}
            >
              <AdminIcon name="logout" />
              {!collapsed && tc.logout}
            </button>
          </div>

          {!collapsed && (
            <div className="relative m-3 mt-5 h-44 overflow-hidden rounded-2xl">
              <Image src="/images/pallo-classroom.jpg" alt="" fill unoptimized sizes="216px" className="object-cover object-[48%_center]" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#4c1d95]/90 via-[#4c1d95]/30 to-transparent" />
              <p className="absolute bottom-3 left-3 right-3 font-serif text-lg font-bold italic leading-tight text-white">
                Dream Bigger,
                <br />
                Speak Better
              </p>
            </div>
          )}
        </aside>

        {/* ───────── Content column ───────── */}
        <div className="flex min-w-0 flex-1 flex-col bg-[#f8f6fe] dark:bg-background">
          {/* desktop top bar */}
          <header className="sticky top-0 z-30 hidden items-center gap-4 border-b border-[#ebe4fb] bg-white/80 px-6 py-3.5 backdrop-blur-md dark:border-border dark:bg-surface/80 lg:flex">
            <button
              onClick={() => setCollapsed((c) => !c)}
              aria-label={t.collapseMenu}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-foreground/70 hover:bg-[#f3effd] dark:hover:bg-surface-muted"
            >
              <AdminIcon name="menu" />
            </button>
            <form onSubmit={onSearch} className="relative w-full max-w-md">
              <AdminIcon name="search" className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.searchStudents}
                className="w-full rounded-full bg-[#f3effd] py-2.5 pl-11 pr-4 text-sm outline-none ring-[#7c3aed]/30 focus:ring-2 dark:bg-surface-muted"
              />
            </form>
            <AdminLangToggle className="ml-auto" />
            <div className="relative">
              <button onClick={() => setMenuOpen((v) => !v)} className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-2 hover:bg-[#f3effd] dark:hover:bg-surface-muted">
                {avatar}
                <span className="text-sm font-bold">{user.displayName || "Admin"}</span>
                <AdminIcon name="chevronDown" className="h-4 w-4 text-foreground/50" />
              </button>
              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-border bg-surface p-1.5 shadow-xl"
                  >
                    <p className="truncate px-3 py-2 text-xs text-foreground/50">{user.email}</p>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-danger hover:bg-danger-soft"
                    >
                      <AdminIcon name="logout" className="h-4 w-4" /> {tc.logout}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </header>

          {/* phone top bar */}
          <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[#ebe4fb] bg-white/90 px-4 py-3 backdrop-blur-md dark:border-border dark:bg-surface/90 lg:hidden">
            <Link href="/admin" className="flex items-center gap-2">
              <Asterisk size={30} color="#5b21b6" />
              <span className="text-xl font-extrabold tracking-tight text-[#5b21b6] dark:text-primary">PALLO!</span>
            </Link>
            <div className="flex items-center gap-2">
              <AdminLangToggle />
              {avatar}
            </div>
          </header>

          <main className="flex-1 p-4 pb-28 sm:p-6 lg:p-8 lg:pb-8">{children}</main>
        </div>
      </div>

      {/* ───────── Phone bottom tab bar ───────── */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#ebe4fb] bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md dark:border-border dark:bg-surface/95 lg:hidden">
        <div className="grid grid-cols-5">
          {mobileTabs.map((href) => {
            const l = navLinks.find((n) => n.href === href)!;
            const active = isActiveHref(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold ${active ? "text-[#5b21b6] dark:text-primary" : "text-foreground/55"}`}
              >
                <AdminIcon name={l.icon} className="h-5 w-5" />
                {t[l.labelKey]}
              </Link>
            );
          })}
          <button
            onClick={() => setMoreOpen(true)}
            className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold ${
              !mobileTabs.some((h) => isActiveHref(pathname, h)) ? "text-[#5b21b6] dark:text-primary" : "text-foreground/55"
            }`}
          >
            <AdminIcon name="grid" className="h-5 w-5" />
            {t.more}
          </button>
        </div>
      </nav>

      {/* phone "more" sheet */}
      <AnimatePresence>
        {moreOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMoreOpen(false)}
              className="fixed inset-0 z-50 bg-[#120b24]/45 backdrop-blur-[2px] lg:hidden"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 320 }}
              className="fixed inset-x-0 bottom-0 z-50 rounded-t-[28px] bg-surface p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] lg:hidden"
            >
              <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-border" />
              <div className="grid grid-cols-2 gap-2">
                {navLinks.map((l) => {
                  const active = isActiveHref(pathname, l.href);
                  return (
                    <Link
                      key={l.href}
                      href={l.href}
                      className={`flex items-center gap-2.5 rounded-2xl px-3.5 py-3 text-sm font-semibold ${
                        active ? "bg-[#5b21b6] text-white" : "bg-[#f3effd] text-foreground/80 dark:bg-surface-muted"
                      }`}
                    >
                      <AdminIcon name={l.icon} className="h-5 w-5 shrink-0" />
                      <span className="truncate">{t[l.labelKey]}</span>
                    </Link>
                  );
                })}
              </div>
              <button
                onClick={handleLogout}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-border py-3 text-sm font-semibold text-danger"
              >
                <AdminIcon name="logout" className="h-4 w-4" /> {tc.logout}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
