"use client";

import { useEffect, useState, type CSSProperties } from "react";

export default function TtsDebugPage() {
  const [log, setLog] = useState<string[]>([]);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [supported, setSupported] = useState<boolean | null>(null);
  const [ua, setUa] = useState("");

  function addLog(msg: string) {
    setLog((prev) => [...prev, `${new Date().toLocaleTimeString()}  ${msg}`]);
  }

  useEffect(() => {
    // Reads browser-only APIs (navigator, speechSynthesis) unavailable during SSR.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUa(navigator.userAgent);
    if (!("speechSynthesis" in window)) {
      setSupported(false);
      addLog("❌ window.speechSynthesis MAVJUD EMAS bu brauzerda");
      return;
    }
    setSupported(true);
    addLog("✅ window.speechSynthesis mavjud");

    function loadVoices() {
      const v = window.speechSynthesis.getVoices();
      setVoices(v);
      addLog(`🔊 ovozlar (voices) topildi: ${v.length} ta`);
    }
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  function testSpeak(lang: "en-US" | "ko-KR") {
    addLog(`--- "${lang}" tugmasi bosildi ---`);
    try {
      const synth = window.speechSynthesis;
      addLog(`holat: speaking=${synth.speaking} pending=${synth.pending} paused=${synth.paused}`);
      if (synth.speaking || synth.pending) synth.cancel();
      const text = lang === "en-US" ? "Hello, this is a test" : "안녕하세요 테스트입니다";
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang;
      u.volume = 1;
      u.rate = 0.95;
      u.onstart = () => addLog("✅ onstart ishga tushdi — ovoz hozir chalinishi kerak");
      u.onend = () => addLog("✅ onend — normal tugadi");
      u.onerror = (e) => addLog(`❌ onerror: "${e.error}"`);
      synth.speak(u);
      addLog("speak() chaqirildi, hodisalar kutilmoqda...");
    } catch (err) {
      addLog(`❌ sinxron xato (throw): ${String(err)}`);
    }
  }

  return (
    <div style={{ padding: 20, fontFamily: "monospace", fontSize: 13, maxWidth: 700, margin: "0 auto", lineHeight: 1.5 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700 }}>🔊 TTS Debug (talaffuz diagnostikasi)</h1>
      <p style={{ wordBreak: "break-all", color: "#666" }}>User agent: {ua}</p>
      <p>speechSynthesis qo&apos;llab-quvvatlanadimi: {supported === null ? "..." : supported ? "✅ ha" : "❌ yo'q"}</p>
      <p>Topilgan ovozlar (voices) soni: {voices.length}</p>
      {voices.length > 0 && (
        <ul style={{ maxHeight: 120, overflowY: "auto", background: "#f3f3f3", padding: "6px 20px", borderRadius: 8 }}>
          {voices.map((v, i) => (
            <li key={i}>
              {v.lang} — {v.name} {v.default ? "(default)" : ""}
            </li>
          ))}
        </ul>
      )}

      <div style={{ margin: "16px 0", display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={() => testSpeak("en-US")} style={btnStyle}>
          🇬🇧 Inglizcha sinash
        </button>
        <button onClick={() => testSpeak("ko-KR")} style={btnStyle}>
          🇰🇷 Koreyscha sinash
        </button>
        <button onClick={() => setLog([])} style={{ ...btnStyle, background: "#666" }}>
          Tozalash
        </button>
      </div>

      <pre
        style={{
          background: "#111",
          color: "#0f0",
          padding: 12,
          borderRadius: 8,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          minHeight: 200,
        }}
      >
        {log.length === 0 ? "Tugmani bosing..." : log.join("\n")}
      </pre>

      <p style={{ color: "#666", marginTop: 12 }}>
        Yuqoridagi tugmani bosing, keyin shu ekranning skrinshotini yuboring — bu bilan qaysi qadamda
        muammo borligini aniq ko&apos;raman.
      </p>
    </div>
  );
}

const btnStyle: CSSProperties = {
  padding: "12px 20px",
  borderRadius: 10,
  border: "none",
  background: "#6366f1",
  color: "white",
  fontWeight: 600,
  fontSize: 14,
};
