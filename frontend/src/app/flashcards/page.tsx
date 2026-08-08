"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useDailyCheckIn } from "@/hooks/useSrsSession";
import { PageHeader } from "@/components/ui/PageHeader";
import { FlashcardSetup } from "@/components/flashcards/FlashcardSetup";
import { FlashcardDeck, type FlashcardResults } from "@/components/flashcards/FlashcardDeck";
import { FlashcardSummary } from "@/components/flashcards/FlashcardSummary";
import { useT } from "@/hooks/useT";
import type { Word } from "@/lib/types";

type Phase = "setup" | "playing" | "summary";

export default function FlashcardsPage() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const t = useT("flashcards");
  useDailyCheckIn();

  const [phase, setPhase] = useState<Phase>("setup");
  const [deck, setDeck] = useState<Word[]>([]);
  const [results, setResults] = useState<FlashcardResults>({ known: [], unknown: [] });
  const [setupSource, setSetupSource] = useState<"lessons" | "difficult" | undefined>(undefined);
  const [roundKey, setRoundKey] = useState(0);

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  if (!ready || !user) return null;

  return (
    <div className="flex-1 px-4 sm:px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <PageHeader title={t.title} subtitle={t.subtitle} />

        {phase === "setup" && (
          <FlashcardSetup
            initialSource={setupSource}
            onStart={(words) => {
              setDeck(words);
              setResults({ known: [], unknown: [] });
              setRoundKey((k) => k + 1);
              setPhase("playing");
            }}
          />
        )}

        {phase === "playing" && (
          <FlashcardDeck
            key={roundKey}
            words={deck}
            onFinish={(res) => {
              setResults(res);
              setPhase("summary");
            }}
          />
        )}

        {phase === "summary" && (
          <FlashcardSummary
            words={deck}
            results={results}
            onRestart={() => {
              setRoundKey((k) => k + 1);
              setPhase("playing");
            }}
            onReviewDifficult={() => {
              setSetupSource("difficult");
              setPhase("setup");
            }}
            onExit={() => router.push("/")}
          />
        )}
      </div>
    </div>
  );
}
