"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { useAuth } from "@/hooks/useAuth";
import { useT } from "@/hooks/useT";
import { ApiError } from "@/lib/api";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const t = useT("auth");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(email, password, displayName);
      router.push("/learn/match");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t.registerTitle);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <Card className="p-7">
          <h1 className="text-2xl font-extrabold mb-1">{t.registerTitle}</h1>
          <p className="text-foreground/60 text-sm mb-6">{t.registerSubtitle}</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">{t.name}</label>
              <input
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface-muted px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary"
                placeholder={t.name}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{t.email}</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface-muted px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{t.password}</label>
              <PasswordInput
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.minChars}
                showLabel={t.showPassword}
                hideLabel={t.hidePassword}
              />
            </div>
            {error && <p className="text-danger text-sm">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t.creating : t.registerButton}
            </Button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-foreground/40 uppercase">{t.orDivider}</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <GoogleSignInButton
            onSuccess={() => router.push("/learn/match")}
            onError={(err) => setError(err instanceof ApiError ? err.message : t.registerTitle)}
          />

          <p className="text-sm text-foreground/60 mt-5 text-center">
            {t.haveAccount}{" "}
            <Link href="/login" className="text-primary font-semibold">
              {t.loginLink}
            </Link>
          </p>
        </Card>
      </motion.div>
    </div>
  );
}
