export function speak(text: string, lang: "en-US" | "ko-KR" = "en-US"): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const synth = window.speechSynthesis;

  const doSpeak = () => {
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 0.95;
      synth.speak(utterance);
    } catch (err) {
      console.warn("speechSynthesis failed:", err);
    }
  };

  try {
    synth.cancel();
  } catch {
    // Some browsers (notably Safari on a non-HTTPS origin) can throw here —
    // fall through and try to speak anyway.
  }

  // WebKit/Safari silently drops a speak() call fired in the same tick as
  // cancel() — pushing it to the next tick avoids that without being
  // perceptible, and still runs close enough to the click for Safari's
  // "must originate from a user gesture" requirement.
  window.setTimeout(doSpeak, 0);
}
