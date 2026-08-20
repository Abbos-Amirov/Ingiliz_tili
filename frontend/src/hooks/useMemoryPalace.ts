"use client";

import { useCallback } from "react";
import { apiFetch } from "@/lib/api";
import type { ImageAttribution, MemoryAnchor, MemoryJourney, PalaceRoomKey, RoomAssignedBy, UnsplashPhoto, Word } from "@/lib/types";

export function useMemoryPalace() {
  const fetchAnchors = useCallback(async (opts?: { journeyId?: string; roomKey?: PalaceRoomKey; known?: boolean }) => {
    const params = new URLSearchParams();
    if (opts?.journeyId) params.set("journeyId", opts.journeyId);
    if (opts?.roomKey) params.set("roomKey", opts.roomKey);
    if (opts?.known !== undefined) params.set("known", String(opts.known));
    const qs = params.toString();
    return apiFetch<{ anchors: MemoryAnchor[] }>(`/memory-anchors${qs ? `?${qs}` : ""}`);
  }, []);

  const fetchUnplacedWords = useCallback(async () => {
    return apiFetch<{ words: Word[] }>("/memory-anchors/unplaced-words");
  }, []);

  const fetchNextForRecall = useCallback(async (opts?: { roomKey?: PalaceRoomKey; knownPool?: boolean }) => {
    const params = new URLSearchParams();
    if (opts?.roomKey) params.set("roomKey", opts.roomKey);
    if (opts?.knownPool) params.set("pool", "known");
    const qs = params.toString();
    return apiFetch<{ anchor: MemoryAnchor | null }>(`/memory-anchors/next-for-recall${qs ? `?${qs}` : ""}`);
  }, []);

  const fetchRoomCounts = useCallback(async () => {
    return apiFetch<{ countByRoomKey: Partial<Record<PalaceRoomKey, number>> }>("/memory-anchors/room-counts");
  }, []);

  const fetchKnownCount = useCallback(async () => {
    return apiFetch<{ count: number }>("/memory-anchors/known-count");
  }, []);

  const markKnown = useCallback(async (id: string) => {
    return apiFetch<{ anchor: MemoryAnchor }>(`/memory-anchors/${id}/know`, { method: "PUT" });
  }, []);

  const unmarkKnown = useCallback(async (id: string) => {
    return apiFetch<{ anchor: MemoryAnchor }>(`/memory-anchors/${id}/unknow`, { method: "PUT" });
  }, []);

  const suggestRoom = useCallback(async (wordId: string) => {
    return apiFetch<{ roomKey: PalaceRoomKey }>(`/memory-anchors/suggest-room?wordId=${wordId}`);
  }, []);

  const createAnchor = useCallback(
    async (data: {
      wordId: string;
      imageUrl?: string;
      imageAttribution?: ImageAttribution;
      textDescription?: string;
      journeyId?: string;
      journeyOrder?: number;
      roomKey?: PalaceRoomKey;
      roomAssignedBy?: RoomAssignedBy;
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

  const fetchSuggestedPhotos = useCallback(async (query: string, page = 1) => {
    return apiFetch<{ photos: UnsplashPhoto[]; hasMore: boolean }>(
      `/memory-anchors/suggested-photos?query=${encodeURIComponent(query)}&page=${page}`,
    );
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
    fetchRoomCounts,
    fetchKnownCount,
    markKnown,
    unmarkKnown,
    suggestRoom,
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
