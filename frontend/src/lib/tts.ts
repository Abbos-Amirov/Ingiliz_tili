export function speak(text: string, lang: "en-US" | "ko-KR" = "en-US"): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  // Must run synchronously inside the tap/click handler that calls it. iOS
  // Safari and WKWebView-based in-app browsers (KakaoTalk, Instagram, ...)
  // silently drop speak() the moment it's deferred (even via setTimeout(0)
  // or a promise microtask) — the engine only permits it as a direct
  // continuation of the user gesture. Only cancel when something is actually
  // in the queue, both to avoid pointless interruption and because it keeps
  // this whole call synchronous with the gesture.
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
export function playAudio(url: string | null | undefined, fallbackText: string, fallbackLang: "en-US" | "ko-KR" = "en-US"): void {
  if (typeof window === "undefined") return;
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
