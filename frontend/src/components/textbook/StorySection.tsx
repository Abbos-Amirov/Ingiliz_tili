"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { apiFetch, ApiError } from "@/lib/api";
import { useLocale, useT } from "@/hooks/useT";
import {
  diffWords,
  pick,
  ROUND_SUBJECTS,
  type Checklist,
  type ProgressCounts,
  type Round,
  type StoryAnswer,
  type StoryGrade,
  type StoryQuestion,
} from "@/lib/textbook";
import { PronunciationButton } from "./PronunciationButton";

function roundLabel(t: { roundPrefix: string; roundSuffix: string }, r: Round) {
  return `${t.roundPrefix}${r}${t.roundSuffix} · ${ROUND_SUBJECTS[r]}`;
}

// Marks the AI-reported error span inside the learner's own sentence.
function HighlightedAnswer({ answer, errorLocation }: { answer: string; errorLocation: string }) {
  const idx = errorLocation ? answer.toLowerCase().indexOf(errorLocation.toLowerCase()) : -1;
  if (idx < 0) return <>{answer}</>;
  return (
    <>
      {answer.slice(0, idx)}
      <mark className="bg-danger-soft text-danger rounded px-0.5 underline decoration-wavy decoration-danger/60">
        {answer.slice(idx, idx + errorLocation.length)}
      </mark>
      {answer.slice(idx + errorLocation.length)}
    </>
  );
}

function QuestionCard({
  index,
  lessonId,
  question,
  round,
  saved,
  onGraded,
}: {
  index: number;
  lessonId: string;
  question: StoryQuestion;
  round: Round;
  saved: StoryAnswer | undefined;
  onGraded: (answer: StoryAnswer, extra: { checklist: Checklist } & ProgressCounts) => void;
}) {
  const t = useT("textbook");
  const { locale } = useLocale();
  const [draft, setDraft] = useState(saved?.koreanDraft ?? "");
  const [answer, setAnswer] = useState(saved?.answer ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function check() {
    if (!answer.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await apiFetch<{ result: StoryGrade; checklist: Checklist } & ProgressCounts>("/textbook/check-answer", {
        method: "POST",
        body: JSON.stringify({ lessonId, questionKey: question.key, round, answer, koreanDraft: draft }),
      });
      onGraded(
        {
          questionKey: question.key,
          round,
          koreanDraft: draft,
          answer: answer.trim(),
          checkedAt: new Date().toISOString(),
          ...res.result,
        },
        res,
      );
    } catch (err) {
      setError(err instanceof ApiError && err.status < 500 ? err.message : t.aiError);
    } finally {
      setBusy(false);
    }
  }

  const graded = saved && saved.answer === answer.trim() ? saved : undefined;
  const subject = ROUND_SUBJECTS[round];

  return (
    <div className="rounded-2xl border border-border bg-surface card-shadow p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="shrink-0 h-8 w-8 rounded-xl bg-ink text-gold font-bold flex items-center justify-center">{index + 1}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-lg leading-snug">{question.question}</p>
            <PronunciationButton text={question.question} size="sm" />
          </div>
          <p className="text-xs text-foreground/45">({question.pronunciationKo})</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-md bg-accent text-white px-2 py-0.5 text-xs font-bold">{t.storyGrammar[question.grammarType]}</span>
            <span className="text-foreground/70">{pick(locale, question.meaningKo, question.meaningUz)}</span>
          </div>
          {round === 1 ? (
            <p className="mt-1 text-xs text-foreground/50">
              {t.example}) {question.examples[1]}
            </p>
          ) : (
            <p className="mt-1 text-xs text-foreground/60">
              {t.writeWith} <span className="font-bold text-primary">{subject}</span>
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={`① ${t.nativeDraft}`}
          maxLength={300}
          className="w-full rounded-xl border border-border bg-surface-muted px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
        />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            check();
          }}
          className="flex gap-2"
        >
          <input
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder={`② ${t.englishAnswer} — ${subject} ...`}
            maxLength={300}
            autoCapitalize="sentences"
            spellCheck={false}
            className="flex-1 min-w-0 rounded-xl border-2 border-border bg-surface px-3.5 py-2.5 font-semibold outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={busy || !answer.trim()}
            className="shrink-0 rounded-xl gradient-primary text-white font-bold px-4 disabled:opacity-40"
          >
            {busy ? t.checking : t.check}
          </button>
        </form>
      </div>

      {error && <p className="mt-2 text-sm text-danger">{error}</p>}

      {graded && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mt-3 rounded-xl p-3.5 text-sm ${graded.isCorrect ? "bg-success-soft" : "bg-danger-soft"}`}
        >
          <p className="font-bold">
            {graded.isCorrect ? "✅ " : "❌ "}
            <HighlightedAnswer answer={graded.answer} errorLocation={graded.isCorrect ? "" : graded.errorLocation} />
          </p>
          {!graded.isCorrect && graded.correctedSentence && (
            <p className="mt-1.5 flex items-center gap-2">
              <span className="text-foreground/60">{t.corrected}:</span>
              <span className="font-bold text-success">{graded.correctedSentence}</span>
            </p>
          )}
          <p className="mt-1.5 text-foreground/75">{pick(locale, graded.explanationKo, graded.explanationUz)}</p>
          {round > 1 && (
            <p className="mt-1.5 text-xs text-foreground/55">
              {t.example}) {question.examples[round]}
            </p>
          )}
        </motion.div>
      )}
    </div>
  );
}

// 문장 변형 체크 — filled from graded answers only (no manual ticking).
export function AutoChecklist({ checklist }: { checklist: Checklist }) {
  const t = useT("textbook");
  const columns = Object.keys(t.checklistColumns) as (keyof typeof t.checklistColumns)[];
  return (
    <div className="rounded-2xl border border-border bg-surface card-shadow overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="font-bold">{t.checklistTitle}</h3>
        <p className="text-xs text-foreground/55">{t.checklistSubtitle}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-primary/5">
              <th className="px-3 py-2 text-left font-bold text-accent whitespace-nowrap">{t.checklistCorner}</th>
              {columns.map((c) => (
                <th key={c} className="px-2 py-2 font-bold whitespace-nowrap text-foreground/70">
                  {t.checklistColumns[c]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {([1, 2, 3] as Round[]).map((r) => (
              <tr key={r} className="border-t border-border">
                <td className="px-3 py-2 font-bold whitespace-nowrap">{roundLabel(t, r)}</td>
                {columns.map((c) => (
                  <td key={c} className="px-2 py-2 text-center">
                    {checklist[r][c] ? (
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-success text-white text-[11px] font-bold">✓</span>
                    ) : (
                      <span className="inline-block h-5 w-5 rounded border-2 border-border" />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// I / She / He side by side, words that changed with the subject highlighted.
export function RoundComparison({ questions, answers }: { questions: StoryQuestion[]; answers: StoryAnswer[] }) {
  const t = useT("textbook");
  const correct = (key: string, r: Round) => answers.find((a) => a.questionKey === key && a.round === r && a.isCorrect)?.answer;
  const rows = questions
    .map((q) => ({ q, a1: correct(q.key, 1), a2: correct(q.key, 2), a3: correct(q.key, 3) }))
    .filter((r) => r.a1 && (r.a2 || r.a3));

  if (rows.length === 0) return <p className="text-sm text-foreground/60 p-4">{t.compareEmpty}</p>;

  const Diffed = ({ base, text }: { base: string; text?: string }) => {
    if (!text) return <span className="text-foreground/30">—</span>;
    return (
      <>
        {diffWords(base, text).map(({ word, changed }, i) => (
          <span key={i}>
            {i > 0 && " "}
            <span className={changed ? "rounded bg-sunny/30 px-0.5 font-bold" : ""}>{word}</span>
          </span>
        ))}
      </>
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-primary/5 text-left">
            <th className="px-3 py-2 w-8"></th>
            <th className="px-3 py-2 font-bold">I</th>
            <th className="px-3 py-2 font-bold">She</th>
            <th className="px-3 py-2 font-bold">He</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ q, a1, a2, a3 }) => (
            <tr key={q.key} className="border-t border-border align-top">
              <td className="px-3 py-2 font-bold text-foreground/50">{questions.indexOf(q) + 1}</td>
              <td className="px-3 py-2">{a1}</td>
              <td className="px-3 py-2"><Diffed base={a1!} text={a2} /></td>
              <td className="px-3 py-2"><Diffed base={a1!} text={a3} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="px-3 py-2 text-xs text-foreground/55">{t.compareHint}</p>
    </div>
  );
}

// Our Story — round tabs, question cards, auto checklist, comparison.
export function StorySection({
  lessonId,
  questions,
  answers,
  checklist,
  onGraded,
}: {
  lessonId: string;
  questions: StoryQuestion[];
  answers: StoryAnswer[];
  checklist: Checklist;
  onGraded: (answer: StoryAnswer, extra: { checklist: Checklist } & ProgressCounts) => void;
}) {
  const t = useT("textbook");
  const [round, setRound] = useState<Round>(1);
  const [compareOpen, setCompareOpen] = useState(false);
  const doneIn = (r: Round) => answers.filter((a) => a.round === r && a.isCorrect).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2" role="tablist">
        {([1, 2, 3] as Round[]).map((r) => (
          <button
            key={r}
            role="tab"
            aria-selected={round === r}
            onClick={() => setRound(r)}
            className={`rounded-xl px-2 sm:px-4 py-2.5 text-xs sm:text-sm font-bold transition-colors border-2 flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 ${
              round === r ? "bg-ink text-on-ink border-ink" : "bg-surface border-border text-foreground/70 hover:border-primary/40"
            }`}
          >
            {roundLabel(t, r)}
            <span className={`text-xs ${round === r ? "text-gold" : "text-foreground/40"}`}>
              {doneIn(r)}/{questions.length}
            </span>
          </button>
        ))}
      </div>

      <div className="grid gap-3">
        {questions.map((q, i) => (
          <QuestionCard
            key={`${q.key}-${round}`}
            index={i}
            lessonId={lessonId}
            question={q}
            round={round}
            saved={answers.find((a) => a.questionKey === q.key && a.round === round)}
            onGraded={onGraded}
          />
        ))}
      </div>

      <AutoChecklist checklist={checklist} />

      <div className="rounded-2xl border border-border bg-surface card-shadow overflow-hidden">
        <button
          type="button"
          onClick={() => setCompareOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 font-bold hover:bg-surface-muted"
          aria-expanded={compareOpen}
        >
          <span>⚖️ {compareOpen ? t.compareTitle : t.compareButton}</span>
          <span className="text-foreground/40">{compareOpen ? "▲" : "▼"}</span>
        </button>
        {compareOpen && <RoundComparison questions={questions} answers={answers} />}
      </div>
    </div>
  );
}
