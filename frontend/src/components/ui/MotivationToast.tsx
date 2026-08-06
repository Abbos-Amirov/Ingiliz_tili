"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useT } from "@/hooks/useT";
import { pickMotivationWord } from "@/lib/motivation";

/**
 * Fires a brief celebratory toast whenever `signal` changes to a new,
 * truthy value (pass an incrementing counter — 0 means "not shown yet").
 */
export function MotivationToast({ signal }: { signal: number }) {
  const t = useT("motivation");
  const [current, setCurrent] = useState<string | null>(null);
  const previousWord = useRef<string | null>(null);

  useEffect(() => {
    if (!signal) return;
    const word = pickMotivationWord(t.words, previousWord.current);
    previousWord.current = word;
    setCurrent(word);
    const timer = window.setTimeout(() => setCurrent(null), 1400);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signal]);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-20 z-50 flex justify-center px-4">
      <AnimatePresence>
        {current && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="rounded-full px-5 py-2.5 text-sm sm:text-base font-bold text-white shadow-lg shadow-indigo-500/30"
            style={{ background: "linear-gradient(90deg, #22c55e, #6366f1)" }}
          >
            {current}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
