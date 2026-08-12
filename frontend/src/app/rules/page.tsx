"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useT } from "@/hooks/useT";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";

export default function RulesHubPage() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const t = useT("nav");

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  if (!ready || !user) return null;

  const items = [
    { href: "/grammar", icon: "📐", label: t.grammar },
    { href: "/function-words", icon: "🧩", label: t.functionWords },
    { href: "/irregular-verbs", icon: "🔁", label: t.irregularVerbs },
  ];

  return (
    <div className="flex-1 px-4 sm:px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <PageHeader title={t.rules} subtitle={t.rulesSubtitle} />

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid gap-4">
          {items.map((item) => (
            <Link key={item.href} href={item.href}>
              <Card className="p-6 flex items-center gap-4 hover:border-primary/50 transition-colors cursor-pointer">
                <span className="text-3xl">{item.icon}</span>
                <p className="font-bold text-lg">{item.label}</p>
              </Card>
            </Link>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
