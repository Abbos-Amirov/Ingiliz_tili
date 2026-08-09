"use client";

import { ReactNode, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAdminAuth } from "@/hooks/useAdminAuth";

const navLinks = [
  { href: "/admin/words", label: "So'zlar", emoji: "📘" },
  { href: "/admin/words/upload", label: "CSV yuklash", emoji: "📤" },
  { href: "/admin/sentences", label: "Gaplar", emoji: "✏️" },
  { href: "/admin/irregular-verbs", label: "Irregular Verbs", emoji: "🔄" },
  { href: "/admin/grammar", label: "Grammatika", emoji: "📐" },
  { href: "/admin/function-words", label: "Kichik so'zlar", emoji: "🔤" },
  { href: "/admin/questions-answers", label: "Savol-Javob", emoji: "❓" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, ready, logout } = useAdminAuth();
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (ready && !user && !isLoginPage) router.replace("/admin/login");
  }, [ready, user, isLoginPage, router]);

  if (isLoginPage) return <>{children}</>;
  if (!ready || !user) return null;

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="hidden sm:flex w-56 flex-col border-r border-border bg-surface p-4">
        <Link href="/admin/words" className="font-extrabold text-lg gradient-text mb-8 px-2">
          Admin panel
        </Link>
        <nav className="flex-1 space-y-1">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                pathname === l.href
                  ? "bg-surface-muted text-primary"
                  : "text-foreground/70 hover:bg-surface-muted hover:text-foreground"
              }`}
            >
              <span>{l.emoji}</span>
              {l.label}
            </Link>
          ))}
        </nav>
        <button
          onClick={() => {
            logout();
            router.push("/admin/login");
          }}
          className="text-sm font-medium text-foreground/60 hover:text-foreground px-3 py-2 text-left"
        >
          Chiqish
        </button>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sm:hidden sticky top-0 z-30 bg-surface border-b border-border px-4 py-3 flex items-center justify-between">
          <span className="font-extrabold gradient-text">Admin panel</span>
          <button
            onClick={() => {
              logout();
              router.push("/admin/login");
            }}
            className="text-sm text-foreground/60"
          >
            Chiqish
          </button>
        </header>
        <nav className="sm:hidden flex border-b border-border bg-surface">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`flex-1 text-center py-2.5 text-xs font-medium ${
                pathname === l.href ? "text-primary" : "text-foreground/60"
              }`}
            >
              {l.emoji} {l.label}
            </Link>
          ))}
        </nav>
        <main className="flex-1 p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
