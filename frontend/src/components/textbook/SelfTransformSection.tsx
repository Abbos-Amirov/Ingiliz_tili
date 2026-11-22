"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { useLocale, useT } from "@/hooks/useT";
import { pick, type SelfTransformBlock, type SelfTransformRow } from "@/lib/textbook";
import { PlayAllButton, PronunciationButton } from "./PronunciationButton";

type RowState = { status: "idle" | "wrong" | "done" | "revealed"; sentence?: string };

function DrillRow({
  lessonPath,
  row,
  initiallyDone,
  onDone,
}: {
  lessonPath: string;
  row: SelfTransformRow;
  initiallyDone: boolean;
  onDone: () => void;
}) {
  const t = useT("textbook");
  const { locale } = useLocale();
  const [value, setValue] = useState("");
  const [state, setState] = useState<RowState>({ status: initiallyDone ? "done" : "idle" });
  const [busy, setBusy] = useState(false);

  async function submit(reveal = false) {
    if (busy || (!reveal && !value.trim())) return;
    setBusy(true);
    try {
      const res = await apiFetch<{ isCorrect: boolean; correctAnswer: string | null }>(`${lessonPath}/drill-check`, {
        method: "POST",
        body: JSON.stringify({ rowKey: row.key, answer: value, reveal }),
      });
      if (reveal) setState({ status: "revealed", sentence: res.correctAnswer ?? "" });
      else if (res.isCorrect) {
        setState({ status: "done", sentence: res.correctAnswer ?? value.trim() });
        onDone();
      } else setState({ status: "wrong" });
    } finally {
      setBusy(false);
    }
  }

  const prompt = pick(locale, row.promptKo, row.promptUz);
  const label = pick(locale, row.labelKo, row.labelUz);

  return (
    <div className={`border-t border-border px-4 py-3 ${state.status === "done" || row.given ? "bg-success-soft/30" : ""}`}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs font-bold text-primary">{label}</span>
        <span className="text-sm text-foreground/60 text-right">{prompt}</span>
      </div>

      {row.given ? (
        <div className="mt-2 flex items-center gap-2">
          <span className="rounded-md bg-accent-soft px-1.5 py-0.5 text-[10px] font-bold text-accent">{t.givenExample}</span>
          <span className="font-semibold">{row.answer}</span>
          {row.answer && <PronunciationButton text={row.answer} size="sm" />}
        </div>
      ) : state.status === "done" ? (
        <div className="mt-2 flex items-center gap-2">
          <span className="font-semibold">{state.sentence ? `✅ ${state.sentence}` : "✅"}</span>
          {state.sentence && <PronunciationButton text={state.sentence} size="sm" />}
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="mt-2 flex gap-2"
        >
          <input
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (state.status === "wrong") setState({ status: "idle" });
            }}
            placeholder="English…"
            autoCapitalize="sentences"
            autoCorrect="off"
            spellCheck={false}
            maxLength={200}
            className={`min-w-0 flex-1 rounded-xl border-2 bg-surface px-3 py-2 font-semibold outline-none focus:border-primary ${
              state.status === "wrong" ? "border-danger animate-shake" : "border-border"
            }`}
          />
          <button
            type="submit"
            disabled={busy || !value.trim()}
            className="shrink-0 rounded-xl bg-ink px-3.5 text-xs font-bold text-on-ink disabled:opacity-40"
          >
            {t.check}
          </button>
        </form>
      )}

      {state.status === "wrong" && (
        <p className="mt-1.5 text-xs">
          <span className="font-semibold text-danger">{t.tryAgain}</span>{" "}
          <button type="button" onClick={() => submit(true)} className="text-accent underline decoration-dotted">
            {t.showAnswer}
          </button>
        </p>
      )}
      {state.status === "revealed" && (
        <p className="mt-1.5 flex items-center gap-2 text-sm font-semibold text-accent">
          → {state.sentence}
          {state.sentence && <PronunciationButton text={state.sentence} size="sm" />}
        </p>
      )}
    </div>
  );
}

// 스스로 변형하기 — one card per block (present/past × I/She, imperative).
export function SelfTransformSection({
  playlists,
  lessonPath,
  blocks,
  completed,
  onRowDone,
}: {
  playlists?: string[][];
  lessonPath: string;
  blocks: SelfTransformBlock[];
  completed: string[];
  onRowDone: (key: string) => void;
}) {
  const { locale } = useLocale();
  const done = new Set(completed);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {blocks.map((b, i) => (
        <div
          key={b.key}
          className={`overflow-hidden rounded-2xl border border-border bg-surface card-shadow ${
            i === blocks.length - 1 && blocks.length % 2 === 1 ? "lg:col-span-2" : ""
          }`}
        >
          <div
            className={`flex items-center justify-between gap-2 px-4 py-2.5 font-bold ${i % 2 === 0 ? "bg-primary/10 text-primary" : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"}`}
          >
            <span>{pick(locale, b.titleKo, b.titleUz)}</span>
            {playlists?.[i] && (
              <PlayAllButton variant="icon" className="bg-white/70 dark:bg-surface/60" texts={playlists[i]} />
            )}
          </div>
          {b.rows.map((r) => (
            <DrillRow
              key={r.key}
              lessonPath={lessonPath}
              row={r}
              initiallyDone={done.has(r.key)}
              onDone={() => onRowDone(r.key)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
