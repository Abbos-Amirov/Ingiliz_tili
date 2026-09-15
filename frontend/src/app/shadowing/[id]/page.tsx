"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useT } from "@/hooks/useT";
import type { TranslationDict } from "@/lib/i18n/translations";
import { apiFetch } from "@/lib/api";
import type { ShadowingVideo, ShadowingSentence, TranscriptWord, Word } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

function cleanWord(word: string): string {
  return word.replace(/[^a-zA-Z']/g, "");
}

function wordsInRange(transcript: TranscriptWord[], sentence: ShadowingSentence): TranscriptWord[] {
  return transcript.filter((w) => w.startTime >= sentence.startTime - 0.01 && w.startTime <= sentence.endTime + 0.01);
}

function TranscriptWordButton({
  item,
  isActive,
  onTap,
}: {
  item: TranscriptWord;
  isActive: boolean;
  onTap: () => void;
}) {
  return (
    <motion.button
      onClick={onTap}
      animate={isActive ? { scale: [1, 1.08, 1] } : { scale: 1 }}
      transition={{ duration: 0.3 }}
      className="inline rounded-md px-1 py-0.5 transition-colors duration-150"
      style={{
        background: isActive ? "linear-gradient(135deg, #F97316, #FB923C)" : "transparent",
        color: isActive ? "white" : "inherit",
        boxShadow: isActive ? "0 2px 10px rgba(249, 115, 22, 0.4)" : "none",
      }}
    >
      {item.word}{" "}
    </motion.button>
  );
}

function SentenceBlock({
  sentence,
  words,
  currentTime,
  onWordTap,
  t,
}: {
  sentence: ShadowingSentence;
  words: TranscriptWord[];
  currentTime: number;
  onWordTap: (word: string) => void;
  t: TranslationDict["shadowing"];
}) {
  const [showTranslation, setShowTranslation] = useState(false);

  return (
    <Card className="p-5" style={{ lineHeight: 2 }}>
      <p className="text-lg">
        {words.map((item, i) => (
          <TranscriptWordButton
            key={i}
            item={item}
            isActive={currentTime >= item.startTime && currentTime < item.endTime}
            onTap={() => onWordTap(item.word)}
          />
        ))}
      </p>

      <button
        onClick={() => setShowTranslation((v) => !v)}
        className="mt-2 text-sm font-semibold text-primary hover:underline"
      >
        {showTranslation ? t.hideTranslation : t.showTranslation}
      </button>

      <AnimatePresence>
        {showTranslation && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="mt-3 rounded-xl bg-surface-muted p-4 space-y-1.5">
              <p className="text-sm">🇺🇿 {sentence.translation.uz}</p>
              <p className="text-sm">🇰🇷 {sentence.translation.ko}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

export default function ShadowingPlayerPage() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const t = useT("shadowing");
  const tSentence = useT("sentence");

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

        <div className="mt-3 mb-5 flex flex-wrap items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-extrabold gradient-text">{video.title}</h1>
          <span className="px-2.5 py-1 rounded-full bg-surface-muted text-xs font-semibold">
            {tSentence.levels[video.level]}
          </span>
        </div>

        <div className="rounded-3xl overflow-hidden bg-black card-shadow flex justify-center">
          {/* Some source clips are portrait (9:16 reels) — capping height
              (not just width) keeps those from stretching to fill the
              screen; the black wrapper pillarboxes them instead. */}
          <video
            ref={videoRef}
            src={video.videoUrl}
            controls
            onTimeUpdate={handleTimeUpdate}
            className="max-w-full max-h-[60vh]"
          />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
          <Button
            variant={speed === 0.75 ? "primary" : "secondary"}
            size="sm"
            onClick={() => setSpeed(speed === 1 ? 0.75 : 1)}
          >
            {speed === 0.75 ? t.speedSlow : t.speedNormal}
          </Button>
          <Button variant="secondary" size="sm" onClick={rewind}>
            {t.rewind}
          </Button>
          {loopStart !== null && loopEnd !== null ? (
            <button
              onClick={clearLoop}
              className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-success-soft text-success"
            >
              {t.loopActive} · {t.clearLoop}
            </button>
          ) : (
            <>
              <Button variant="secondary" size="sm" onClick={markLoopStart}>
                {t.markStart}
              </Button>
              <Button variant="secondary" size="sm" onClick={markLoopEnd} disabled={loopStart === null}>
                {t.markEnd}
              </Button>
            </>
          )}
        </div>
        {loopStart !== null && loopEnd === null && (
          <p className="text-center text-xs text-foreground/40 mt-2">{t.loopHint}</p>
        )}

        <div className="mt-6 space-y-4">
          {video.sentences.length > 0 ? (
            video.sentences.map((sentence, si) => (
              <SentenceBlock
                key={si}
                sentence={sentence}
                words={wordsInRange(video.transcript, sentence)}
                currentTime={currentTime}
                onWordTap={handleWordTap}
                t={t}
              />
            ))
          ) : (
            <Card className="p-5" style={{ lineHeight: 2 }}>
              <p className="text-lg">
                {video.transcript.map((item, i) => (
                  <TranscriptWordButton
                    key={i}
                    item={item}
                    isActive={currentTime >= item.startTime && currentTime < item.endTime}
                    onTap={() => handleWordTap(item.word)}
                  />
                ))}
              </p>
            </Card>
          )}
        </div>
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
