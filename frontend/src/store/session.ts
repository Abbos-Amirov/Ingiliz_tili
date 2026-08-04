import { create } from "zustand";
import type { Word } from "@/lib/types";

interface SessionState {
  lastRoundWords: Word[];
  setLastRoundWords: (words: Word[]) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  lastRoundWords: [],
  setLastRoundWords: (words) => set({ lastRoundWords: words }),
}));
