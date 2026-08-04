"use client";

import { useCallback, useEffect, useRef } from "react";
import { apiFetch } from "@/lib/api";
import type { Word } from "@/lib/types";

export function useDailyCheckIn() {
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    apiFetch("/stats/daily-check-in", { method: "POST" }).catch(() => {});
  }, []);
}

export function useSrsActions() {
  const fetchNextBatch = useCallback(async (mode: "match" | "sentence", limit = 8) => {
    const res = await apiFetch<{ words: Word[] }>(
      `/srs/next-batch?mode=${mode}&limit=${limit}`,
    );
    return res.words;
  }, []);

  const submitReview = useCallback(async (wordId: string, result: "correct" | "wrong") => {
    return apiFetch("/srs/review", {
      method: "POST",
      body: JSON.stringify({ wordId, result }),
    });
  }, []);

  return { fetchNextBatch, submitReview };
}
