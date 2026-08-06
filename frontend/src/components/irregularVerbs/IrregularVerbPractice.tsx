"use client";

import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { IrregularVerb } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { MotivationToast } from "@/components/ui/MotivationToast";
import { MatchWordTile } from "@/components/match/MatchWordTile";
import { useIrregularVerbActions, type IrregularVerbForm } from "@/hooks/useIrregularVerbPractice";
import { useT } from "@/hooks/useT";
import type { TranslationDict } from "@/lib/i18n/translations";

type FieldStage = "idle" | "choices" | "write";
type FieldResult = "correct" | "wrong" | "helped" | null;

interface FieldState {
  value: string;
  stage: FieldStage;
  result: FieldResult;
  choices: string[];
  selectedCorrect: string | null;
  wrongChoice: string | null;
  writeError: boolean;
  helpLoading: boolean;
}

function freshField(): FieldState {
  return {
    value: "",
    stage: "idle",
    result: null,
    choices: [],
    selectedCorrect: null,
    wrongChoice: null,
    writeError: false,
    helpLoading: false,
  };
}

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, "");
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const FORMS: IrregularVerbForm[] = ["past", "participle"];

export function IrregularVerbPractice() {
  const t = useT("irregularVerbs");
  const { fetchPracticeBatch, submitFormReview, fetchFormDistractors } = useIrregularVerbActions();

  const [verbs, setVerbs] = useState<IrregularVerb[] | null>(null);
  const [index, setIndex] = useState(0);
  const [pastField, setPastField] = useState<FieldState>(freshField());
  const [participleField, setParticipleField] = useState<FieldState>(freshField());
  const [motivationSignal, setMotivationSignal] = useState(0);
  const [done, setDone] = useState<{ total: number } | null>(null);
  const advanceScheduled = useRef(false);

  useEffect(() => {
    fetchPracticeBatch(8).then((res) => setVerbs(res.verbs));
  }, [fetchPracticeBatch]);

  const verb = verbs?.[index] ?? null;

  const fieldFor = useCallback(
    (form: IrregularVerbForm) => (form === "past" ? pastField : participleField),
    [pastField, participleField],
  );
  const setFieldFor = useCallback(
    (form: IrregularVerbForm) => (form === "past" ? setPastField : setParticipleField),
    [],
  );

  const updateField = useCallback(
    (form: IrregularVerbForm, patch: Partial<FieldState> | ((f: FieldState) => Partial<FieldState>)) => {
      setFieldFor(form)((prev) => ({ ...prev, ...(typeof patch === "function" ? patch(prev) : patch) }));
    },
    [setFieldFor],
  );

  const correctValue = useCallback(
    (form: IrregularVerbForm): string => {
      if (!verb) return "";
      return form === "past" ? verb.past : verb.participle;
    },
    [verb],
  );

  async function handleHelp(form: IrregularVerbForm) {
    if (!verb) return;
    const field = fieldFor(form);
    if (field.helpLoading || field.result !== null || field.stage !== "idle") return;
    updateField(form, { helpLoading: true });
    try {
      const res = await fetchFormDistractors(verb._id, form, 4);
      const options = shuffle([correctValue(form), ...res.distractors]);
      updateField(form, { choices: options, stage: "choices", helpLoading: false });
    } catch {
      updateField(form, { helpLoading: false });
    }
  }

  function handleChoiceClick(form: IrregularVerbForm, choice: string) {
    const field = fieldFor(form);
    if (field.selectedCorrect) return;
    if (choice === correctValue(form)) {
      updateField(form, { selectedCorrect: choice });
      window.setTimeout(() => {
        updateField(form, { stage: "write", selectedCorrect: null, wrongChoice: null });
      }, 700);
    } else {
      updateField(form, { wrongChoice: choice });
      window.setTimeout(() => {
        setFieldFor(form)((prev) => (prev.wrongChoice === choice ? { ...prev, wrongChoice: null } : prev));
      }, 500);
    }
  }

  const resolveField = useCallback(
    (form: IrregularVerbForm, result: "correct" | "wrong" | "helped") => {
      if (!verb) return;
      submitFormReview(verb._id, form, result).catch(() => {});
      updateField(form, { result });
    },
    [verb, submitFormReview, updateField],
  );

  function handleWriteConfirm(form: IrregularVerbForm) {
    const field = fieldFor(form);
    if (normalize(field.value) !== normalize(correctValue(form))) {
      updateField(form, { writeError: true });
      window.setTimeout(() => updateField(form, { writeError: false }), 500);
      return;
    }
    resolveField(form, "helped");
  }

  function handleCheckBoth() {
    FORMS.forEach((form) => {
      const field = fieldFor(form);
      if (field.result !== null || field.stage !== "idle") return;
      const isCorrect = normalize(field.value) === normalize(correctValue(form));
      resolveField(form, isCorrect ? "correct" : "wrong");
    });
  }

  // Once both forms resolve (via Check or via their own help flow), celebrate
  // (only if both were fully independent) and advance to the next verb.
  useEffect(() => {
    if (!verb || advanceScheduled.current) return;
    if (pastField.result === null || participleField.result === null) return;
    advanceScheduled.current = true;
    if (pastField.result === "correct" && participleField.result === "correct") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMotivationSignal((s) => s + 1);
    }
    const timer = window.setTimeout(() => {
      setVerbs((currentVerbs) => {
        if (!currentVerbs) return currentVerbs;
        if (index + 1 < currentVerbs.length) {
          setIndex((i) => i + 1);
          setPastField(freshField());
          setParticipleField(freshField());
          advanceScheduled.current = false;
        } else {
          setDone({ total: currentVerbs.length });
        }
        return currentVerbs;
      });
    }, 1300);
    return () => window.clearTimeout(timer);
  }, [pastField.result, participleField.result, verb, index]);

  function restart() {
    setDone(null);
    setIndex(0);
    setPastField(freshField());
    setParticipleField(freshField());
    advanceScheduled.current = false;
    setVerbs(null);
    fetchPracticeBatch(8).then((res) => setVerbs(res.verbs));
  }

  if (verbs === null) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (verbs.length === 0) {
    return <p className="text-center py-20 text-foreground/60">{t.empty}</p>;
  }

  if (done) {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center py-10">
        <p className="text-5xl font-extrabold gradient-text mb-2">{done.total}</p>
        <p className="text-foreground/60 mb-8">{t.resultSuffix}</p>
        <Button onClick={restart}>{t.anotherRound}</Button>
      </motion.div>
    );
  }

  if (!verb) return null;

  const anyFieldMidHelp = FORMS.some((form) => {
    const f = fieldFor(form);
    return f.result === null && (f.stage === "choices" || f.stage === "write");
  });
  const pendingFields = FORMS.filter((form) => fieldFor(form).result === null);
  const canCheck =
    !anyFieldMidHelp && pendingFields.length > 0 && pendingFields.every((form) => fieldFor(form).value.trim());

  return (
    <div className="w-full">
      <MotivationToast signal={motivationSignal} />
      <ProgressBar value={index} total={verbs.length} label={t.practiceTab} />

      <AnimatePresence mode="wait">
        <motion.div
          key={verb._id}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.25 }}
        >
          <Card className="mt-6 p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground/50 mb-2 text-center">
              {t.baseLabel}
            </p>
            <p className="text-3xl font-extrabold gradient-text mb-1 text-center">{verb.base.toUpperCase()}</p>
            <p className="text-foreground/60 text-center mb-6">{verb.korean}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FormField
                label={t.pastLabel}
                field={pastField}
                correctValue={correctValue("past")}
                onValueChange={(v) => updateField("past", { value: v })}
                onHelp={() => handleHelp("past")}
                onChoiceClick={(c) => handleChoiceClick("past", c)}
                onWriteConfirm={() => handleWriteConfirm("past")}
                t={t}
              />
              <FormField
                label={t.participleLabel}
                field={participleField}
                correctValue={correctValue("participle")}
                onValueChange={(v) => updateField("participle", { value: v })}
                onHelp={() => handleHelp("participle")}
                onChoiceClick={(c) => handleChoiceClick("participle", c)}
                onWriteConfirm={() => handleWriteConfirm("participle")}
                t={t}
              />
            </div>

            {!anyFieldMidHelp && pendingFields.length > 0 && (
              <div className="mt-6 flex justify-center">
                <Button onClick={handleCheckBoth} disabled={!canCheck}>
                  {t.check}
                </Button>
              </div>
            )}
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function FormField({
  label,
  field,
  correctValue,
  onValueChange,
  onHelp,
  onChoiceClick,
  onWriteConfirm,
  t,
}: {
  label: string;
  field: FieldState;
  correctValue: string;
  onValueChange: (v: string) => void;
  onHelp: () => void;
  onChoiceClick: (choice: string) => void;
  onWriteConfirm: () => void;
  t: TranslationDict["irregularVerbs"];
}): ReactNode {
  if (field.result !== null) {
    const isGood = field.result === "correct";
    const isHelped = field.result === "helped";
    const badgeText = isHelped ? t.helpedBadge : isGood ? t.correctBadge : t.wrongBadge;
    return (
      <div
        className={`rounded-xl border-2 p-4 text-center ${
          isHelped ? "border-primary bg-primary/5" : isGood ? "border-success bg-success-soft" : "border-danger bg-danger-soft"
        }`}
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-foreground/50 mb-1">{label}</p>
        <p className="text-lg font-bold mb-1">{correctValue}</p>
        <p className={`text-xs font-semibold ${isHelped ? "text-primary" : isGood ? "text-success" : "text-danger"}`}>
          {badgeText}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border-2 border-border p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-foreground/50 mb-2 text-center">{label}</p>

      <AnimatePresence>
        {field.stage === "write" && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-xs font-semibold text-primary text-center mb-1"
          >
            {t.writeInstruction}
          </motion.p>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {field.stage === "write" && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-base font-semibold text-foreground/25 text-center select-none mb-1"
          >
            {correctValue}
          </motion.p>
        )}
      </AnimatePresence>

      <motion.input
        value={field.value}
        onChange={(e) => onValueChange(e.target.value)}
        disabled={field.stage === "choices"}
        animate={field.writeError ? { x: [0, -6, 6, -4, 4, 0] } : {}}
        transition={{ duration: 0.35 }}
        placeholder={field.stage === "write" ? correctValue : "..."}
        className={`w-full text-center rounded-xl border-2 bg-surface-muted px-3 py-2.5 font-semibold outline-none focus:ring-2 focus:ring-primary disabled:opacity-70 transition-colors ${
          field.writeError ? "border-danger" : "border-border"
        } ${
          field.stage === "write"
            ? "placeholder:text-foreground/25 placeholder:font-semibold"
            : "placeholder:text-foreground/40"
        }`}
      />

      {field.stage === "idle" && (
        <div className="mt-2 flex justify-center">
          <button
            type="button"
            onClick={onHelp}
            disabled={field.helpLoading}
            className="text-sm font-medium text-foreground/40 hover:text-primary transition-colors disabled:opacity-50"
          >
            {field.helpLoading ? "…" : t.helpBtn}
          </button>
        </div>
      )}

      {field.stage === "write" && (
        <div className="mt-2 flex justify-center">
          <Button type="button" size="sm" disabled={!field.value.trim()} onClick={onWriteConfirm}>
            {t.confirm}
          </Button>
        </div>
      )}

      <AnimatePresence>
        {field.stage === "choices" && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-3 grid grid-cols-1 gap-2"
          >
            {field.choices.map((choice) => {
              const state =
                field.selectedCorrect === choice ? "matched" : field.wrongChoice === choice ? "wrong" : "idle";
              return (
                <MatchWordTile
                  key={choice}
                  text={choice}
                  state={state}
                  disabled={Boolean(field.selectedCorrect)}
                  onClick={() => onChoiceClick(choice)}
                />
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
