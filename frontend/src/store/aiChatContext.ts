import { create } from "zustand";

export interface SentenceChatContext {
  korean: string;
  englishWords: string[];
  formula: string;
}

interface AiChatContextState {
  context: SentenceChatContext | null;
  setContext: (context: SentenceChatContext | null) => void;
}

// Lets a page with an active sentence exercise (Sentence Building, Q&A) hand
// the globally-mounted AiChatWidget (see app/layout.tsx) something specific
// to talk about — everywhere else the widget just runs as a general tutor.
export const useAiChatContextStore = create<AiChatContextState>((set) => ({
  context: null,
  setContext: (context) => set({ context }),
}));
