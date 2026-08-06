"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useT } from "@/hooks/useT";
import { PageHeader } from "@/components/ui/PageHeader";
import { IrregularVerbTable } from "@/components/irregularVerbs/IrregularVerbTable";
import { IrregularVerbPractice } from "@/components/irregularVerbs/IrregularVerbPractice";

export default function IrregularVerbsPage() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const t = useT("irregularVerbs");
  const [mode, setMode] = useState<"reference" | "practice">("reference");

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  if (!ready || !user) return null;

  return (
    <div className="flex-1 px-4 sm:px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <PageHeader title={t.title} subtitle={t.subtitle} />

        <div className="flex justify-center gap-2 mb-8">
          <button
            onClick={() => setMode("reference")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              mode === "reference" ? "gradient-primary text-white" : "bg-surface-muted text-foreground/60 hover:text-foreground"
            }`}
          >
            {t.referenceTab}
          </button>
          <button
            onClick={() => setMode("practice")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              mode === "practice" ? "gradient-primary text-white" : "bg-surface-muted text-foreground/60 hover:text-foreground"
            }`}
          >
            {t.practiceTab}
          </button>
        </div>

        {mode === "reference" ? <IrregularVerbTable /> : <IrregularVerbPractice key="practice" />}
      </div>
    </div>
  );
}
