"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { GrammarTopic } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { GrammarFormula } from "./GrammarFormula";
import { useT, useLocale } from "@/hooks/useT";

export function GrammarTopicCard({
  topic,
  masteryPercent,
  locked,
}: {
  topic: GrammarTopic;
  masteryPercent: number;
  locked: boolean;
}) {
  const t = useT("grammar");
  const { locale } = useLocale();

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Link href={`/grammar/${topic._id}`} className="block h-full">
        <Card className="p-5 h-full flex flex-col gap-3 hover:border-primary/50 hover:shadow-lg transition-all relative">
          {locked && (
            <span className="absolute top-3 right-3 text-base" title={t.lockedHint}>
              🔒
            </span>
          )}
          <h3 className="font-bold text-base pr-6 leading-snug">{topic.title[locale]}</h3>
          <div className="py-1">
            <GrammarFormula formula={topic.formula} size="sm" />
          </div>
          <div className="mt-auto pt-1">
            <ProgressBar value={masteryPercent} total={100} />
          </div>
          {locked && <p className="text-[11px] text-accent leading-snug">{t.lockedHint}</p>}
        </Card>
      </Link>
    </motion.div>
  );
}
