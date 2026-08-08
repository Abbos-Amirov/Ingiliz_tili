import { create } from "zustand";
import type { Word } from "@/lib/types";

interface SessionState {
  lastRoundWords: Word[];
  // Per-word "hide the image, text-only" flag for this round's Active Recall
  // step (see FEATURE 1's progressive fading) — computed once when the round
  // is fetched via /srs/next-batch and carried through to the Recall step.
  imageHiddenByWordId: Record<string, boolean>;
  setLastRoundWords: (words: Word[], imageHiddenByWordId?: Record<string, boolean>) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  lastRoundWords: [],
  imageHiddenByWordId: {},
  setLastRoundWords: (words, imageHiddenByWordId = {}) => set({ lastRoundWords: words, imageHiddenByWordId }),
}));
