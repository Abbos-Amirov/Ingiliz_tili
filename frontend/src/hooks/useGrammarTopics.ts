"use client";

import { useCallback } from "react";
import { apiFetch } from "@/lib/api";
import type { Difficulty, GrammarTopic, GrammarTopicProgress } from "@/lib/types";

export function useGrammarTopics() {
  const fetchTopics = useCallback(async (level?: Difficulty) => {
    const query = level ? `?level=${level}` : "";
    return apiFetch<{ topics: GrammarTopic[] }>(`/grammar-topics${query}`);
  }, []);

  const fetchTopic = useCallback(async (id: string) => {
    return apiFetch<{ topic: GrammarTopic }>(`/grammar-topics/${id}`);
  }, []);

  const fetchProgressSummary = useCallback(async () => {
    return apiFetch<{ progress: GrammarTopicProgress[] }>("/grammar-topics/progress-summary");
  }, []);

  const submitQuizResult = useCallback(async (topicId: string, correct: number, total: number) => {
    return apiFetch(`/grammar-topics/${topicId}/quiz-result`, {
      method: "POST",
      body: JSON.stringify({ correct, total }),
    });
  }, []);

  return { fetchTopics, fetchTopic, fetchProgressSummary, submitQuizResult };
}
