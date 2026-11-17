"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useT } from "@/hooks/useT";
import { PageHeader } from "@/components/ui/PageHeader";
import { HubCard } from "@/components/ui/HubCard";

export default function WordBankHubPage() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const t = useT("nav");

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  if (!ready || !user) return null;

  const items = [
    { href: "/learn/match", icon: "🔤", label: t.match },
    { href: "/learn/match-only", icon: "🧩", label: t.matchOnly },
    { href: "/all-words", icon: "📖", label: t.allWords },
    { href: "/learn/sentence", icon: "📝", label: t.sentence },
  ];

  return (
    <div className="flex-1 px-4 sm:px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <PageHeader title={t.wordBank} subtitle={t.wordBankSubtitle} />

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid gap-4">
          {items.map((item, i) => (
            <Link key={item.href} href={item.href}>
              <HubCard icon={item.icon} label={item.label} index={i} />
            </Link>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
