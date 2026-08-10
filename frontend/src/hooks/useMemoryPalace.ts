"use client";

import { useCallback } from "react";
import { apiFetch } from "@/lib/api";
import type { ImageAttribution, MemoryAnchor, MemoryJourney, UnsplashPhoto, Word } from "@/lib/types";

export function useMemoryPalace() {
  const fetchAnchors = useCallback(async (journeyId?: string) => {
    const qs = journeyId ? `?journeyId=${journeyId}` : "";
    return apiFetch<{ anchors: MemoryAnchor[] }>(`/memory-anchors${qs}`);
  }, []);

  const fetchUnplacedWords = useCallback(async () => {
    return apiFetch<{ words: Word[] }>("/memory-anchors/unplaced-words");
  }, []);

  const fetchNextForRecall = useCallback(async () => {
    return apiFetch<{ anchor: MemoryAnchor | null }>("/memory-anchors/next-for-recall");
  }, []);

  const createAnchor = useCallback(
    async (data: {
      wordId: string;
      imageUrl?: string;
      imageAttribution?: ImageAttribution;
      textDescription?: string;
      journeyId?: string;
      journeyOrder?: number;
    }) => {
      return apiFetch<{ anchor: MemoryAnchor }>("/memory-anchors", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    [],
  );

  const deleteAnchor = useCallback(async (id: string) => {
    return apiFetch<{ success: true }>(`/memory-anchors/${id}`, { method: "DELETE" });
  }, []);

  const fetchSuggestedPhotos = useCallback(async (query: string) => {
    return apiFetch<{ photos: UnsplashPhoto[] }>(`/memory-anchors/suggested-photos?query=${encodeURIComponent(query)}`);
  }, []);

  const submitRecallResult = useCallback(async (id: string, result: "correct" | "wrong") => {
    return apiFetch<{ anchor: MemoryAnchor; correctAnswer: string }>(`/memory-anchors/${id}/recall-result`, {
      method: "PUT",
      body: JSON.stringify({ result }),
    });
  }, []);

  const fetchJourneys = useCallback(async () => {
    return apiFetch<{ journeys: MemoryJourney[] }>("/memory-journeys");
  }, []);

  const createJourney = useCallback(async (title: string, description = "") => {
    return apiFetch<{ journey: MemoryJourney }>("/memory-journeys", {
      method: "POST",
      body: JSON.stringify({ title, description }),
    });
  }, []);

  const fetchJourney = useCallback(async (id: string) => {
    return apiFetch<{ journey: MemoryJourney; anchors: MemoryAnchor[] }>(`/memory-journeys/${id}`);
  }, []);

  const deleteJourney = useCallback(async (id: string) => {
    return apiFetch<{ success: true }>(`/memory-journeys/${id}`, { method: "DELETE" });
  }, []);

  return {
    fetchAnchors,
    fetchUnplacedWords,
    fetchNextForRecall,
    createAnchor,
    deleteAnchor,
    fetchSuggestedPhotos,
    submitRecallResult,
    fetchJourneys,
    createJourney,
    fetchJourney,
    deleteJourney,
  };
}
