"use client";

import { createContext, useContext, useEffect, useId, useState } from "react";
import { onSequenceChange, playAudio, playSequence, speak, stopSequence } from "@/lib/tts";
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

// "Listen to all": plays every text of a group one after another (e.g. all
// nouns, every sentence of a section). Tap again to stop. Sits next to the
// per-item 🔊 buttons, which keep working as before.
export function PlayAllButton({
  texts,
  label,
  variant = "pill",
  className = "",
}: {
  texts: string[];
  label?: string;
  variant?: "pill" | "icon";
  className?: string;
}) {
  const audio = useContext(TextbookAudioContext);
  const t = useT("textbook");
  const id = useId();
  const [playing, setPlaying] = useState<{ index: number } | null>(null);

  useEffect(
    () => onSequenceChange((current, index) => setPlaying(current === id && index >= 0 ? { index } : null)),
    [id],
  );
  // Leaving the page (or this section) stops its playback.
  useEffect(() => () => stopSequence(id), [id]);

  const items = texts.filter((x) => x.trim()).map((text) => ({ text, url: audio[text.trim()] }));
  if (items.length === 0) return null;

  const onClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (playing) stopSequence();
    else playSequence(id, items);
  };
  const title = playing ? t.stopListening : (label ?? t.listenAll);

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={title}
        title={title}
        className={`shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/25 text-sm transition-colors hover:bg-white/40 ${
          playing ? "ring-2 ring-white animate-pulse" : ""
        } ${className}`}
      >
        {playing ? "⏹" : "🔊"}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={title}
      className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-colors ${
        playing ? "bg-primary text-white dark:text-[#1b1035]" : "bg-primary/10 text-primary hover:bg-primary/20"
      } ${className}`}
    >
      <span aria-hidden>{playing ? "⏹" : "🔊"}</span>
      {title}
      {playing && (
        <span className="tabular-nums opacity-80">
          {playing.index + 1}/{items.length}
        </span>
      )}
    </button>
  );
}
