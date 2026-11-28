export type SpeechLang = "en-US" | "ko-KR" | "uz-UZ";

export function speak(text: string, lang: SpeechLang = "en-US"): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  // Must run synchronously inside the tap/click handler that calls it. iOS
  // Safari and WKWebView-based in-app browsers (KakaoTalk, Instagram, ...)
  // silently drop speak() the moment it's deferred (even via setTimeout(0)
  // or a promise microtask) — the engine only permits it as a direct
  // continuation of the user gesture. Only cancel when something is actually
  // in the queue, both to avoid pointless interruption and because it keeps
  // this whole call synchronous with the gesture.
  stopSequence();
  try {
    const synth = window.speechSynthesis;
    if (synth.speaking || synth.pending) {
      synth.cancel();
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.95;
    synth.speak(utterance);
  } catch (err) {
    console.warn("speechSynthesis failed:", err);
  }
}

let currentAudio: HTMLAudioElement | null = null;

/**
 * Plays a pre-generated pronunciation clip. Many in-app browsers (KakaoTalk,
 * Instagram, ...) and Android WebView don't implement window.speechSynthesis
 * at all, so real audio files — not live speech synthesis — are the only
 * reliable option there. Falls back to speak() when no clip is available yet
 * (e.g. newly added content) or if playback fails for any reason.
 */
export function playAudio(url: string | null | undefined, fallbackText: string, fallbackLang: SpeechLang = "en-US"): void {
  if (typeof window === "undefined") return;
  stopSequence();
  if (url) {
    try {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }
      const audio = new Audio(url);
      currentAudio = audio;
      const playPromise = audio.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => speak(fallbackText, fallbackLang));
      }
      return;
    } catch (err) {
      console.warn("audio playback failed, falling back to speechSynthesis:", err);
    }
  }
  speak(fallbackText, fallbackLang);
}

// ─── Play a list one after another ("listen to all" buttons) ──────────────

type SequenceListener = (id: string | null, index: number) => void;
let seqToken = 0;
let seqId: string | null = null;
let seqAudio: HTMLAudioElement | null = null;
let seqTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<SequenceListener>();

function notify(index: number) {
  listeners.forEach((l) => l(seqId, index));
}

/** Subscribe to which sequence (by id) is playing and at which item. */
export function onSequenceChange(l: SequenceListener): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** Stops the running sequence (only if it's `onlyId`, when given). */
export function stopSequence(onlyId?: string): void {
  if (seqId === null || (onlyId !== undefined && seqId !== onlyId)) return;
  seqToken++;
  seqId = null;
  if (seqTimer) clearTimeout(seqTimer);
  seqTimer = null;
  if (seqAudio) {
    seqAudio.pause();
    seqAudio.onended = null;
    seqAudio.onerror = null;
  }
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  notify(-1);
}

/**
 * Plays texts one after another (pre-generated clip when there is one, with a
 * short pause between items), over and over until stopSequence() is called. Must be called from the tap handler: the single
 * reused <audio> element is unlocked by that gesture, so iOS / in-app
 * browsers let the following items play too. Texts without a clip are read
 * with speechSynthesis when the browser has it, otherwise skipped.
 */
export function playSequence(id: string, items: { text: string; url?: string | null }[], gapMs = 450): void {
  if (typeof window === "undefined") return;
  stopSequence();
  if (currentAudio) currentAudio.pause();
  const hasSynth = "speechSynthesis" in window;
  const list = items.filter((i) => i.text.trim() && (i.url || hasSynth));
  if (!list.length) return;

  const token = ++seqToken;
  seqId = id;
  if (!seqAudio) seqAudio = new Audio();
  const audio = seqAudio;

  const playAt = (i: number) => {
    if (token !== seqToken) return;
    if (i >= list.length) {
      // Loops from the start (after a slightly longer pause) until the
      // learner presses Stop — see stopSequence().
      seqTimer = setTimeout(() => playAt(0), gapMs * 2);
      return;
    }
    notify(i);
    const next = () => {
      if (token !== seqToken) return;
      seqTimer = setTimeout(() => playAt(i + 1), gapMs);
    };
    const item = list[i];
    const viaSpeech = () => {
      if (!hasSynth) return next();
      const u = new SpeechSynthesisUtterance(item.text);
      u.lang = "en-US";
      u.rate = 0.95;
      u.onend = next;
      u.onerror = next;
      window.speechSynthesis.speak(u);
    };
    if (item.url) {
      audio.onended = next;
      audio.onerror = viaSpeech;
      audio.src = item.url;
      const pr = audio.play();
      if (pr && typeof pr.catch === "function") pr.catch(() => token === seqToken && viaSpeech());
    } else {
      viaSpeech();
    }
  };
  playAt(0);
}
