"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiFetch } from "@/lib/api";
import type { Sentence } from "@/lib/types";
import { SentenceBuilder } from "@/components/sentence/SentenceBuilder";
import { useT } from "@/hooks/useT";

/** Reuses the existing Sentence Building component, filtered to only the
 * sentences that teach this grammar topic's formula. */
export function GrammarPractice({ formula }: { formula: string }) {
  const t = useT("grammar");
  const [pool, setPool] = useState<Sentence[] | null>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    apiFetch<{ sentences: Sentence[] }>(`/sentences?formula=${encodeURIComponent(formula)}&limit=30`)
      .then((res) => setPool(res.sentences))
      .catch(() => setPool([]));
  }, [formula]);

  function next() {
    setIndex((i) => (pool && pool.length > 0 ? (i + 1) % pool.length : 0));
  }

  if (pool === null) {
    return (
      <div className="flex justify-center py-10">
        <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (pool.length === 0) {
    return <p className="text-center py-10 text-foreground/60 text-sm">{t.practiceEmpty}</p>;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pool[index]._id}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.25 }}
      >
        <SentenceBuilder sentence={pool[index]} onComplete={next} />
      </motion.div>
    </AnimatePresence>
  );
}
