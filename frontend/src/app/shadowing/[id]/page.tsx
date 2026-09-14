"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useT } from "@/hooks/useT";
import { apiFetch } from "@/lib/api";
import type { ShadowingVideo, Word } from "@/lib/types";
import { Card } from "@/components/ui/Card";

function cleanWord(word: string): string {
  return word.replace(/[^a-zA-Z']/g, "");
}

export default function ShadowingPlayerPage() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const t = useT("shadowing");

  const videoRef = useRef<HTMLVideoElement>(null);
  const [video, setVideo] = useState<ShadowingVideo | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [speed, setSpeed] = useState<0.75 | 1>(1);

  const [loopStart, setLoopStart] = useState<number | null>(null);
  const [loopEnd, setLoopEnd] = useState<number | null>(null);

  const [popupWord, setPopupWord] = useState<string | null>(null);
  const [popupTranslation, setPopupTranslation] = useState<Word | null>(null);
  const [popupLoading, setPopupLoading] = useState(false);

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  useEffect(() => {
    if (!user || !params.id) return;
    apiFetch<{ video: ShadowingVideo }>(`/shadowing/${params.id}`).then((res) => setVideo(res.video));
  }, [user, params.id]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = speed;
  }, [speed]);

  function handleTimeUpdate() {
    const el = videoRef.current;
    if (!el) return;
    if (loopStart !== null && loopEnd !== null && el.currentTime >= loopEnd) {
      el.currentTime = loopStart;
    }
    setCurrentTime(el.currentTime);
  }

  function rewind() {
    const el = videoRef.current;
    if (!el) return;
    el.currentTime = Math.max(0, el.currentTime - 3);
  }

  function markLoopStart() {
    setLoopStart(videoRef.current?.currentTime ?? 0);
  }

  function markLoopEnd() {
    setLoopEnd(videoRef.current?.currentTime ?? 0);
  }

  function clearLoop() {
    setLoopStart(null);
    setLoopEnd(null);
  }

  async function handleWordTap(word: string) {
    videoRef.current?.pause();
    const cleaned = cleanWord(word);
    if (!cleaned) return;
    setPopupWord(word);
    setPopupTranslation(null);
    setPopupLoading(true);
    try {
      const res = await apiFetch<{ words: Word[] }>(`/words?english=${encodeURIComponent(cleaned)}&limit=1`);
      setPopupTranslation(res.words[0] ?? null);
    } finally {
      setPopupLoading(false);
    }
  }

  if (!ready || !user) return null;
  if (!video) {
    return (
      <div className="flex-1 flex justify-center py-20">
        <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 px-4 sm:px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <Link href="/shadowing" className="text-sm text-foreground/50 hover:text-foreground">
          {t.backToList}
        </Link>

        <h1 className="text-xl sm:text-2xl font-extrabold mt-3 mb-4">{video.title}</h1>

        <video
          ref={videoRef}
          src={video.videoUrl}
          controls
          onTimeUpdate={handleTimeUpdate}
          className="w-full rounded-2xl bg-black"
        />

        <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setSpeed(speed === 1 ? 0.75 : 1)}
            className={`px-3.5 py-2 rounded-full text-sm font-semibold transition-colors ${
              speed === 0.75 ? "gradient-primary text-white" : "bg-surface-muted text-foreground/70"
            }`}
          >
            {speed === 0.75 ? t.speedSlow : t.speedNormal}
          </button>
          <button onClick={rewind} className="px-3.5 py-2 rounded-full text-sm font-semibold bg-surface-muted text-foreground/70">
            {t.rewind}
          </button>
          {loopStart !== null && loopEnd !== null ? (
            <button onClick={clearLoop} className="px-3.5 py-2 rounded-full text-sm font-semibold bg-success-soft text-success">
              {t.loopActive} · {t.clearLoop}
            </button>
          ) : (
            <>
              <button onClick={markLoopStart} className="px-3.5 py-2 rounded-full text-sm font-semibold bg-surface-muted text-foreground/70">
                {t.markStart}
              </button>
              <button
                onClick={markLoopEnd}
                disabled={loopStart === null}
                className="px-3.5 py-2 rounded-full text-sm font-semibold bg-surface-muted text-foreground/70 disabled:opacity-40"
              >
                {t.markEnd}
              </button>
            </>
          )}
        </div>
        {loopStart !== null && loopEnd === null && <p className="text-center text-xs text-foreground/40 mt-2">{t.loopHint}</p>}

        <Card className="mt-6 p-5 leading-loose text-lg">
          {video.transcript.map((item, i) => {
            const isActive = currentTime >= item.startTime && currentTime < item.endTime;
            return (
              <button
                key={i}
                onClick={() => handleWordTap(item.word)}
                className="inline rounded px-0.5 transition-colors"
                style={{
                  backgroundColor: isActive ? "#F97316" : "transparent",
                  color: isActive ? "white" : "inherit",
                }}
              >
                {item.word}{" "}
              </button>
            );
          })}
        </Card>
        <p className="text-center text-xs text-foreground/40 mt-2">{t.tapWordHint}</p>

        {popupWord && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-80 z-50 rounded-2xl bg-surface border border-border card-shadow p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold">{popupWord}</p>
                {popupLoading ? (
                  <p className="text-sm text-foreground/40 mt-1">...</p>
                ) : popupTranslation ? (
                  <p className="text-sm text-foreground/70 mt-1">{popupTranslation.korean}</p>
                ) : (
                  <p className="text-sm text-foreground/40 mt-1">{t.translationNotFound}</p>
                )}
              </div>
              <button onClick={() => setPopupWord(null)} className="text-foreground/40 hover:text-foreground text-lg leading-none">
                ×
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
