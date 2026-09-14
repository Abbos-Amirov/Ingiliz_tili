import type { TranscriptWord } from "../services/transcription.service";

export interface TranscriptSentence {
  text: string;
  startTime: number;
  endTime: number;
}

// Groups the word-level transcript (see transcription.service.ts) into
// sentences by splitting after a word ending in ./!/? — Whisper keeps
// terminal punctuation attached to the word itself, so this needs no extra
// parsing. Used once per video when an admin triggers sentence translation
// (see shadowing.controller.ts) rather than on every learner page load.
export function segmentTranscriptIntoSentences(transcript: TranscriptWord[]): TranscriptSentence[] {
  const groups: TranscriptWord[][] = [];
  let current: TranscriptWord[] = [];

  for (const word of transcript) {
    current.push(word);
    if (/[.!?]$/.test(word.word.trim())) {
      groups.push(current);
      current = [];
    }
  }
  if (current.length > 0) groups.push(current);

  return groups.map((words) => ({
    text: words.map((w) => w.word).join(" "),
    startTime: words[0].startTime,
    endTime: words[words.length - 1].endTime,
  }));
}
