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
