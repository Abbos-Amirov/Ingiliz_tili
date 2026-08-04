"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useT } from "@/hooks/useT";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, ready, logout } = useAuth();
  const t = useT("nav");

  const links = [
    { href: "/learn/match", label: t.match },
    { href: "/learn/sentence", label: t.sentence },
    { href: "/lessons", label: t.lessons },
    { href: "/all-words", label: t.allWords },
    { href: "/progress", label: t.progress },
  ];

  if (pathname.startsWith("/admin")) return null;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/80 backdrop-blur-md">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 flex items-center justify-between h-16">
        <Link href="/" className="font-extrabold text-lg gradient-text">
          Ingliz✦Learn
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
              className="text-sm font-medium text-foreground/60 hover:text-foreground"
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
        </div>
      </div>
      {ready && user && (
        <nav className="sm:hidden flex items-center justify-around border-t border-border">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`flex-1 text-center py-2.5 text-xs font-medium ${
                pathname === l.href ? "text-primary" : "text-foreground/60"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
