"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { useLocale, useT } from "@/hooks/useT";
import { pick, type Puzzle, type PuzzleRow } from "@/lib/textbook";
import { PlayAllButton, PronunciationButton } from "./PronunciationButton";
import { VERB_TYPE_STYLE } from "./VerbOverview";

type RowState = { status: "idle" | "wrong" | "done" | "revealed"; sentence?: string; answer?: string };

function PuzzleRowItem({
  lessonPath,
  row,
  initiallyDone,
  onDone,
}: {
  lessonPath: string;
  row: PuzzleRow;
  initiallyDone: boolean;
  onDone: () => void;
}) {
  const t = useT("textbook");
  const { locale } = useLocale();
  const [value, setValue] = useState("");
  const [state, setState] = useState<RowState>({ status: initiallyDone ? "done" : "idle" });
  const [busy, setBusy] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [before, after] = row.prompt.split("___");

  async function submit(reveal = false) {
    if (busy || (!reveal && !value.trim())) return;
    setBusy(true);
    try {
      const res = await apiFetch<{ isCorrect: boolean; correctAnswer: string | null; sentence: string | null }>(
        `${lessonPath}/puzzle-check`,
        { method: "POST", body: JSON.stringify({ rowKey: row.key, answer: value, reveal }) },
      );
      if (reveal) {
        setState({ status: "revealed", answer: res.correctAnswer ?? "", sentence: res.sentence ?? "" });
      } else if (res.isCorrect) {
        setState({ status: "done", answer: value.trim(), sentence: res.sentence ?? "" });
        onDone();
      } else {
        setState({ status: "wrong" });
        setShowHint(true);
      }
    } finally {
      setBusy(false);
    }
  }

  const done = state.status === "done";
  return (
    <div className={`grid grid-cols-[88px_1fr] sm:grid-cols-[110px_1fr_180px] items-center border-t border-border ${done ? "bg-success-soft/40" : ""}`}>
      <div className="px-3 py-3 text-sm font-bold text-foreground/70">
        <span className="text-accent">{row.transform === "negative" || row.transform === "question" || row.transform === "wh_question" ? "›" : "⌄"}</span>{" "}
        {t.transforms[row.transform]}
      </div>
      <div className="px-2 py-2.5">
        {done && state.sentence ? (
          <div className="flex items-center gap-2">
            <span className="font-semibold">✅ {state.sentence}</span>
            <PronunciationButton text={state.sentence} size="sm" />
          </div>
        ) : done ? (
          // Completed in an earlier visit — answers aren't sent to the client.
          <p className="font-semibold">
            {before}
            <span className="mx-1 rounded-md bg-success-soft px-2 text-success">✓</span>
            {after}
          </p>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
            className="flex flex-wrap items-center gap-x-1.5 gap-y-2"
          >
            {before && <span className="font-semibold">{before.trim()}</span>}
            <input
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                if (state.status === "wrong") setState({ status: "idle" });
              }}
              disabled={done}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              className={`w-28 rounded-lg border-b-2 bg-accent-soft/60 px-2 py-1 font-semibold outline-none focus:bg-accent-soft ${
                state.status === "wrong" ? "border-danger animate-shake" : "border-accent"
              }`}
              aria-label={t.transforms[row.transform]}
            />
            {after && <span className="font-semibold">{after.trim()}</span>}
            <button
              type="submit"
              disabled={busy || !value.trim()}
              className="ml-1 rounded-lg bg-ink text-on-ink px-3 py-1.5 text-xs font-bold disabled:opacity-40"
            >
              {t.check}
            </button>
            {state.status === "wrong" && <span className="text-xs text-danger font-semibold">{t.tryAgain}</span>}
            {state.status === "revealed" && (
              <span className="text-xs font-semibold text-accent">→ {state.sentence}</span>
            )}
          </form>
        )}
      </div>
      <div className="col-span-2 sm:col-span-1 px-3 pb-3 sm:py-2.5 text-xs text-foreground/60 flex items-center gap-2 flex-wrap">
        {showHint || done ? (
          <span>
            <span className="font-bold text-foreground/70">{t.hint}:</span> {pick(locale, row.hintKo, row.hintUz)}
          </span>
        ) : (
          <button type="button" onClick={() => setShowHint(true)} className="underline decoration-dotted">
            {t.hint}
          </button>
        )}
        {!done && state.status !== "revealed" && state.status === "wrong" && (
          <button type="button" onClick={() => submit(true)} className="underline decoration-dotted text-accent">
            {t.showAnswer}
          </button>
        )}
      </div>
    </div>
  );
}

// 오늘의 퍼즐 — one table per verb type, blanks checked server-side.
export function PuzzleSection({
  playlists,
  lessonPath,
  puzzles,
  completed,
  onRowDone,
}: {
  playlists?: string[][];
  lessonPath: string;
  puzzles: Puzzle[];
  completed: string[];
  onRowDone: (key: string) => void;
}) {
  const t = useT("textbook");
  const { locale } = useLocale();
  const done = new Set(completed);
  return (
    <div className="space-y-5">
      {puzzles.map((p, pi) => {
        const style = VERB_TYPE_STYLE[p.verbType];
        return (
          <div key={p.verbType} className="rounded-2xl border border-border bg-surface card-shadow overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${style.tile} ${style.text}`}>{t.verbTypes[p.verbType]}</span>
                  <PlayAllButton
                    variant="icon"
                    className="bg-primary/10 text-primary hover:bg-primary/20"
                    texts={playlists?.[pi] ?? [p.baseSentence]}
                    label={`${t.verbTypes[p.verbType]} — ${t.listenAll}`}
                  />
                </span>
                <span className="font-bold text-lg">{p.baseSentence}</span>
                <PronunciationButton text={p.baseSentence} size="sm" />
              </div>
              <span className="text-xs text-foreground/50">
                {p.pronunciationKo} · {pick(locale, p.baseMeaningKo, p.baseMeaningUz)}
              </span>
            </div>
            {p.rows.map((row) => (
              <PuzzleRowItem
                key={row.key}
                lessonPath={lessonPath}
                row={row}
                initiallyDone={done.has(row.key)}
                onDone={() => onRowDone(row.key)}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}
