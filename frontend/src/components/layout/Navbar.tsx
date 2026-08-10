"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useT } from "@/hooks/useT";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, ready, logout } = useAuth();
  const t = useT("nav");
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { href: "/learn/match", label: t.match },
    { href: "/learn/sentence", label: t.sentence },
    { href: "/lessons", label: t.lessons },
    { href: "/all-words", label: t.allWords },
    { href: "/irregular-verbs", label: t.irregularVerbs },
    { href: "/grammar", label: t.grammar },
    { href: "/function-words", label: t.functionWords },
    { href: "/questions-answers", label: t.questionAnswers },
    { href: "/flashcards", label: t.flashcards },
    { href: "/memory-palace", label: t.memoryPalace },
    { href: "/progress", label: t.progress },
  ];

  useEffect(() => {
    // Close the mobile menu on navigation; Navbar persists across route
    // changes (it isn't remounted), so this can't be done via a `key` reset.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMenuOpen(false);
  }, [pathname]);

  if (pathname.startsWith("/admin")) return null;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/80 backdrop-blur-md">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 flex items-center justify-between h-16">
        <Link href="/" className="font-extrabold text-lg gradient-text">
          English✦Learn
        </Link>

        {ready && user && (
          <nav className="hidden sm:flex items-center gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === l.href
                    ? "bg-surface-muted text-primary"
                    : "text-foreground/70 hover:text-foreground hover:bg-surface-muted"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-1.5 sm:gap-3">
          <LanguageSwitcher />
          {ready && user ? (
            <button
              onClick={() => {
                logout();
                router.push("/");
              }}
              className="hidden sm:inline text-sm font-medium text-foreground/60 hover:text-foreground"
            >
              {t.logout}
            </button>
          ) : (
            ready && (
              <Link
                href="/login"
                className="text-sm font-semibold gradient-primary text-white px-4 py-2 rounded-lg"
              >
                {t.login}
              </Link>
            )
          )}

          {ready && user && (
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Menyu"
              aria-expanded={menuOpen}
              className="sm:hidden flex flex-col items-center justify-center gap-1 h-10 w-10 rounded-lg hover:bg-surface-muted"
            >
              <motion.span
                animate={menuOpen ? { rotate: 45, y: 5 } : { rotate: 0, y: 0 }}
                className="block h-0.5 w-5 rounded-full bg-foreground"
              />
              <motion.span
                animate={menuOpen ? { opacity: 0 } : { opacity: 1 }}
                className="block h-0.5 w-5 rounded-full bg-foreground"
              />
              <motion.span
                animate={menuOpen ? { rotate: -45, y: -5 } : { rotate: 0, y: 0 }}
                className="block h-0.5 w-5 rounded-full bg-foreground"
              />
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {ready && user && menuOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="sm:hidden overflow-hidden border-t border-border bg-surface"
          >
            <div className="flex flex-col p-2">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`px-4 py-3 rounded-lg text-sm font-medium ${
                    pathname === l.href ? "bg-surface-muted text-primary" : "text-foreground/70"
                  }`}
                >
                  {l.label}
                </Link>
              ))}
              <button
                onClick={() => {
                  logout();
                  router.push("/");
                }}
                className="mt-1 px-4 py-3 rounded-lg text-sm font-medium text-left text-danger"
              >
                {t.logout}
              </button>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
