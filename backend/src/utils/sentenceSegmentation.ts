import type { TranscriptWord } from "../services/transcription.service";

export interface TranscriptSentence {
  text: string;
  startTime: number;
  endTime: number;
}

// A real pause in speech (0.5s+) is a strong signal of a clause/sentence
// boundary even when Whisper attached no punctuation — some clips (e.g. a
// terse movie monologue) come back with none at all, which without this
// fallback collapsed the ENTIRE transcript into one "sentence" and blew
// past translateShadowingSentence's token budget every time.
const PAUSE_THRESHOLD_SECONDS = 0.5;
// Belt-and-suspenders cap for the rare clip with neither punctuation nor
// pauses (a flat, run-on reading) — never let a chunk grow unbounded.
const MAX_WORDS_PER_SENTENCE = 20;

// Groups the word-level transcript (see transcription.service.ts) into
// sentences by splitting after a word ending in ./!/?, after a long pause,
// or once a chunk gets too long. Used once per video when an admin triggers
// sentence translation (see shadowing.controller.ts) rather than on every
// learner page load.
export function segmentTranscriptIntoSentences(transcript: TranscriptWord[]): TranscriptSentence[] {
  const groups: TranscriptWord[][] = [];
  let current: TranscriptWord[] = [];

  transcript.forEach((word, i) => {
    current.push(word);

    const endsWithPunctuation = /[.!?]$/.test(word.word.trim());
    const next = transcript[i + 1];
    const longPauseAhead = next ? next.startTime - word.endTime >= PAUSE_THRESHOLD_SECONDS : false;
    const tooLong = current.length >= MAX_WORDS_PER_SENTENCE;

    if (endsWithPunctuation || longPauseAhead || tooLong) {
      groups.push(current);
      current = [];
    }
  });
  if (current.length > 0) groups.push(current);

  return groups.map((words) => ({
    text: words.map((w) => w.word).join(" "),
    startTime: words[0].startTime,
    endTime: words[words.length - 1].endTime,
  }));
}
