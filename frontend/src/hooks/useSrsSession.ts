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
    return apiFetch<{ words: Word[]; bonusPractice: boolean; imageHiddenByWordId: Record<string, boolean> }>(
      `/srs/next-batch?mode=${mode}&limit=${limit}`,
    );
  }, []);

  const submitReview = useCallback(async (wordId: string, result: "correct" | "wrong" | "helped") => {
    return apiFetch("/srs/review", {
      method: "POST",
      body: JSON.stringify({ wordId, result }),
    });
  }, []);

  const fetchDistractors = useCallback(async (wordId: string, count = 4) => {
    return apiFetch<{ distractors: Word[] }>(`/srs/recall-distractors?wordId=${wordId}&count=${count}`);
  }, []);

  return { fetchNextBatch, submitReview, fetchDistractors };
}
