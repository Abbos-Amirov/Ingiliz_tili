"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useT } from "@/hooks/useT";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";

export default function AllWordsPage() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const t = useT("lessons");
  const tMatch = useT("match");
  const tSentence = useT("sentence");
  const [wordCount, setWordCount] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  useEffect(() => {
    apiFetch<{ total: number }>("/words?limit=1")
      .then((res) => setWordCount(res.total))
      .catch(() => {});
  }, []);

  if (!ready || !user) return null;

  return (
    <div className="flex-1 px-4 sm:px-6 py-16">
      <div className="mx-auto max-w-lg text-center">
        <div className="text-4xl mb-4">📚</div>
        <PageHeader
          title={t.allWordsTitle}
          subtitle={t.allWordsSubtitle}
          count={wordCount}
          countLabel={t.wordsSuffix}
        />

        <p className="font-semibold text-sm text-foreground/70 mb-3">{t.modePickerTitle}</p>
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          <Link href="/lessons/practice?all=true&mode=match">
            <Button size="lg">{tMatch.title}</Button>
          </Link>
          <Link href="/lessons/practice?all=true&mode=sentence">
            <Button size="lg" variant="secondary">
              {tSentence.title}
            </Button>
          </Link>
        </div>

        <Link href="/lessons" className="text-sm text-foreground/50 hover:text-foreground">
          {t.backToLessons}
        </Link>
      </div>
    </div>
  );
}
