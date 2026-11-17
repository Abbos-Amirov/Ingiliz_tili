"use client";

import { createContext, useContext } from "react";
import { playAudio, speak } from "@/lib/tts";
import { useT } from "@/hooks/useT";

// text → pre-generated clip URL for the current lesson (see backend
// textbook.service.ts). Provided once by the lesson page.
export const TextbookAudioContext = createContext<Record<string, string>>({});

// 🔊 for any English text in a lesson. Uses the lesson's pre-generated clip
// when there is one (works in the Android app, whose WebView has no
// speechSynthesis), otherwise the existing speak() fallback.
export function PronunciationButton({ text, size = "md" }: { text: string; size?: "sm" | "md" }) {
  const audio = useContext(TextbookAudioContext);
  const t = useT("textbook");
  const url = audio[text.trim()];
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        if (url) playAudio(url, text, "en-US");
        else speak(text, "en-US");
      }}
      aria-label={`${t.listen}: ${text}`}
      title={t.listen}
      className={`shrink-0 inline-flex items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors ${
        size === "sm" ? "h-7 w-7 text-xs" : "h-9 w-9 text-sm"
      }`}
    >
      🔊
    </button>
  );
}
