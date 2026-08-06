export function speak(text: string, lang: "en-US" | "ko-KR" = "en-US"): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  // Some browsers (notably Safari on a non-HTTPS origin) throw synchronously
  // here. Speech is a nice-to-have, so a failure must never block the caller's
  // own logic (tile selection, matching, etc.) from running.
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn("speechSynthesis failed:", err);
  }
}
