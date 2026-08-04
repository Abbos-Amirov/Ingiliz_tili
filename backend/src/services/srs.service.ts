export interface SrsState {
  easeFactor: number;
  interval: number;
  repetitions: number;
  lapses: number;
}

export interface SrsResult extends SrsState {
  dueDate: Date;
}

function addDays(base: Date, days: number): Date {
  const result = new Date(base);
  result.setDate(result.getDate() + days);
  return result;
}

const MIN_EASE = 1.3;
const MAX_EASE = 2.8;

export function reviewWord(state: SrsState, result: "correct" | "wrong", now = new Date()): SrsResult {
  if (result === "wrong") {
    return {
      easeFactor: Math.max(MIN_EASE, state.easeFactor - 0.2),
      interval: 1,
      repetitions: 0,
      lapses: state.lapses + 1,
      dueDate: addDays(now, 1),
    };
  }

  const nextRepetitions = state.repetitions + 1;
  let nextInterval: number;
  if (nextRepetitions === 1) nextInterval = 1;
  else if (nextRepetitions === 2) nextInterval = 3;
  else if (nextRepetitions === 3) nextInterval = 7;
  else nextInterval = Math.round(state.interval * state.easeFactor);

  return {
    easeFactor: Math.min(MAX_EASE, state.easeFactor + 0.05),
    interval: nextInterval,
    repetitions: nextRepetitions,
    lapses: state.lapses,
    dueDate: addDays(now, nextInterval),
  };
}

export const DIFFICULT_WORD_LAPSE_THRESHOLD = 3;
