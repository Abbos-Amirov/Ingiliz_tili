"use client";

import { useCallback } from "react";
import { apiFetch } from "@/lib/api";
import type { IrregularVerb } from "@/lib/types";

export type IrregularVerbForm = "past" | "participle";
export type IrregularVerbResult = "correct" | "wrong" | "helped";

export function useIrregularVerbActions() {
  const fetchPracticeBatch = useCallback(async (limit = 8) => {
    return apiFetch<{ verbs: IrregularVerb[]; bonusPractice: boolean }>(
      `/irregular-verbs/practice-batch?limit=${limit}`,
    );
  }, []);

  const submitFormReview = useCallback(
    async (irregularVerbId: string, form: IrregularVerbForm, result: IrregularVerbResult) => {
      return apiFetch("/irregular-verbs/review", {
        method: "POST",
        body: JSON.stringify({ irregularVerbId, form, result }),
      });
    },
    [],
  );

  const fetchFormDistractors = useCallback(async (irregularVerbId: string, form: IrregularVerbForm, count = 4) => {
    return apiFetch<{ distractors: string[] }>(
      `/irregular-verbs/distractors?irregularVerbId=${irregularVerbId}&form=${form}&count=${count}`,
    );
  }, []);

  return { fetchPracticeBatch, submitFormReview, fetchFormDistractors };
}
