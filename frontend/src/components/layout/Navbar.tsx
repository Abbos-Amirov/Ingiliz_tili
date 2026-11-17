"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useT } from "@/hooks/useT";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { PalloLogo } from "@/components/ui/PalloLogo";

function BrandLink({ size = 40 }: { size?: number }) {
  return (
    <Link href="/" className="flex items-center gap-2.5 group" aria-label="Pallo!">
      <PalloLogo size={size} className="shrink-0 transition-transform duration-500 group-hover:rotate-[20deg]" />
      <span className="flex flex-col leading-none">
        <span className="font-serif font-bold text-xl tracking-tight text-foreground">Pallo!</span>
        <span className="mt-0.5 text-[10px] font-extrabold uppercase tracking-[0.22em] text-accent">English</span>
      </span>
    </Link>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, ready, logout } = useAuth();
  const t = useT("nav");
  const [menuOpen, setMenuOpen] = useState(false);

  // Grouped into 3 topic hubs (each hub page links onward to its own
  // sub-pages) plus standalone features, so the mobile menu stays short.
  const links = [
    // /lessons/practice is the old word-lesson practice (reached from All
    // Words), so it stays under Word Bank rather than Lessons.
    { href: "/lessons", label: t.lessons, activeMatch: ["/lessons"], exclude: ["/lessons/practice"] },
    { href: "/learn", label: t.wordBank, activeMatch: ["/learn", "/all-words", "/lessons/practice"] },
    { href: "/rules", label: t.rules, activeMatch: ["/rules", "/grammar", "/function-words", "/irregular-verbs"] },
    { href: "/practice", label: t.practice, activeMatch: ["/practice", "/questions-answers", "/flashcards"] },
    { href: "/memory-palace", label: t.memoryPalace, activeMatch: ["/memory-palace"] },
    { href: "/shadowing", label: t.shadowing, activeMatch: ["/shadowing"] },
    { href: "/progress", label: t.progress, activeMatch: ["/progress"] },
  ];

  function isActive(activeMatch: string[], exclude: string[] = []) {
    const matches = (prefix: string) => pathname === prefix || pathname.startsWith(`${prefix}/`);
    return activeMatch.some(matches) && !exclude.some(matches);
  }

  function handleLogout() {
    logout();
    router.push("/");
  }

  useEffect(() => {
    // Close the mobile menu on navigation; Navbar persists across route
    // changes (it isn't remounted), so this can't be done via a `key` reset.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMenuOpen(false);
  }, [pathname]);

  // While the mobile menu is open: lock page scroll and close on Escape.
  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  if (pathname.startsWith("/admin")) return null;

  const loginButton = ready && !user && (
    <Link
      href="/login"
      className="text-sm font-bold bg-ink text-on-ink px-5 py-2.5 rounded-xl ring-1 ring-inset ring-white/10 hover:bg-ink-soft transition-colors dark:bg-gold dark:text-[#1b1035]"
    >
      {t.login}
    </Link>
  );

  return (
    <>
      {/* ───────── Desktop (xl+): full-width bar ───────── */}
      <header className="sticky top-0 z-40 hidden xl:block border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-6 flex items-center justify-between gap-4 h-16">
          <BrandLink />

          {ready && user && (
            <nav className="flex items-center gap-0.5">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`relative whitespace-nowrap px-2.5 py-2 rounded-lg text-sm transition-colors ${
                    isActive(l.activeMatch, l.exclude)
                      ? "text-foreground font-bold"
                      : "font-semibold text-foreground/60 hover:text-foreground hover:bg-surface-muted"
                  }`}
                >
                  {l.label}
                  {isActive(l.activeMatch, l.exclude) && (
                    <motion.span layoutId="nav-active" className="absolute left-3 right-3 -bottom-0.5 h-[3px] rounded-full bg-gold" />
                  )}
                </Link>
              ))}
            </nav>
          )}

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            {ready && user ? (
              <button
                onClick={handleLogout}
                className="whitespace-nowrap text-sm font-medium text-foreground/60 hover:text-foreground"
              >
                {t.logout}
              </button>
            ) : (
              loginButton
            )}
          </div>
        </div>
      </header>

      {/* ───────── Phones & tablets: one floating card ─────────
          Logo, language and the menu button live in a single rounded card;
          the menu opens inside that same card, drawn over the page (the
          header keeps a fixed height), so nothing below gets pushed down.
          A dimmed backdrop catches stray taps and closes the menu. */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="nav-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setMenuOpen(false)}
            className="fixed inset-0 z-30 bg-[#120b24]/45 backdrop-blur-[2px] xl:hidden"
            aria-hidden
          />
        )}
      </AnimatePresence>

      <header className="sticky top-0 z-40 h-[76px] xl:hidden">
        <div
          className={`absolute inset-x-3 top-2.5 rounded-2xl ring-1 ring-border transition-[box-shadow,background-color] duration-300 sm:inset-x-6 ${
            menuOpen
              ? "bg-surface shadow-[0_30px_60px_-20px_rgba(18,11,36,0.55)]"
              : "bg-surface/95 backdrop-blur-md shadow-[0_10px_30px_-18px_rgba(18,11,36,0.45)]"
          }`}
        >
          <div className="flex h-14 items-center justify-between gap-3 pl-3 pr-2">
            <BrandLink size={36} />
            <div className="flex items-center gap-1.5">
              <LanguageSwitcher />
              {loginButton}
              {ready && user && (
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-label="Menyu"
                  aria-expanded={menuOpen}
                  aria-controls="mobile-menu"
                  className={`flex h-10 w-10 flex-col items-center justify-center gap-1 rounded-xl transition-colors ${
                    menuOpen ? "bg-ink" : "bg-surface-muted hover:bg-primary/10"
                  }`}
                >
                  <motion.span
                    animate={menuOpen ? { rotate: 45, y: 5 } : { rotate: 0, y: 0 }}
                    className={`block h-0.5 w-5 rounded-full ${menuOpen ? "bg-on-ink" : "bg-foreground"}`}
                  />
                  <motion.span
                    animate={menuOpen ? { opacity: 0 } : { opacity: 1 }}
                    className={`block h-0.5 w-5 rounded-full ${menuOpen ? "bg-on-ink" : "bg-foreground"}`}
                  />
                  <motion.span
                    animate={menuOpen ? { rotate: -45, y: -5 } : { rotate: 0, y: 0 }}
                    className={`block h-0.5 w-5 rounded-full ${menuOpen ? "bg-on-ink" : "bg-foreground"}`}
                  />
                </button>
              )}
            </div>
          </div>

          <AnimatePresence initial={false}>
            {ready && user && menuOpen && (
              <motion.nav
                id="mobile-menu"
                key="mobile-menu"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden rounded-b-2xl"
              >
                <div className="max-h-[calc(100svh-110px)] overflow-y-auto border-t border-border p-2">
                  <div className="grid gap-1">
                    {links.map((l) => {
                      const active = isActive(l.activeMatch, l.exclude);
                      return (
                        <Link
                          key={l.href}
                          href={l.href}
                          className={`flex items-center justify-between rounded-xl px-4 py-3.5 text-[15px] transition-colors ${
                            active ? "bg-ink text-on-ink font-bold" : "font-semibold text-foreground/80 hover:bg-surface-muted"
                          }`}
                        >
                          {l.label}
                          <span className={active ? "text-gold" : "text-foreground/30"} aria-hidden>
                            →
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                  <div className="mx-3 my-2 h-px bg-border" />
                  <button
                    onClick={handleLogout}
                    className="w-full rounded-xl px-4 py-3.5 text-left text-[15px] font-semibold text-danger hover:bg-danger-soft"
                  >
                    {t.logout}
                  </button>
                </div>
              </motion.nav>
            )}
          </AnimatePresence>
        </div>
      </header>
    </>
  );
}
