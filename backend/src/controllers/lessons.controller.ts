import { RequestHandler } from "express";
import { Word } from "../models/Word";
import { Sentence } from "../models/Sentence";

interface LessonSummary {
  lessonNumber: number;
  lessonNumberEnd: number;
  wordCount: number;
  sentenceCount: number;
}

interface RangeCount {
  _id: { start: number; end: number };
  count: number;
}

// Groups by the exact [lessonNumber, lessonNumberEnd] range as entered by the
// admin, so a combined teaching day (e.g. 12-14) shows as a single card rather
// than three separate ones.
const GROUP_BY_RANGE_PIPELINE = [
  { $group: { _id: { start: "$lessonNumber", end: "$lessonNumberEnd" }, count: { $sum: 1 } } },
];

// Grammar Hub practice sentences aren't part of the lesson curriculum.
const SENTENCE_GROUP_BY_RANGE_PIPELINE = [
  { $match: { isGrammarPractice: { $ne: true } } },
  ...GROUP_BY_RANGE_PIPELINE,
];

export const listLessons: RequestHandler = async (_req, res, next) => {
  try {
    const [wordCounts, sentenceCounts] = await Promise.all([
      Word.aggregate<RangeCount>(GROUP_BY_RANGE_PIPELINE),
      Sentence.aggregate<RangeCount>(SENTENCE_GROUP_BY_RANGE_PIPELINE),
    ]);

    const rangeKey = (start: number, end: number) => `${start}-${end}`;
    const wordCountByRange = new Map(wordCounts.map((w) => [rangeKey(w._id.start, w._id.end), w.count]));
    const sentenceCountByRange = new Map(sentenceCounts.map((s) => [rangeKey(s._id.start, s._id.end), s.count]));
    const allRanges = new Map<string, { start: number; end: number }>();
    for (const w of wordCounts) allRanges.set(rangeKey(w._id.start, w._id.end), w._id);
    for (const s of sentenceCounts) allRanges.set(rangeKey(s._id.start, s._id.end), s._id);

    const lessons: LessonSummary[] = Array.from(allRanges.entries())
      .sort((a, b) => a[1].start - b[1].start)
      .map(([key, { start, end }]) => ({
        lessonNumber: start,
        lessonNumberEnd: end,
        wordCount: wordCountByRange.get(key) ?? 0,
        sentenceCount: sentenceCountByRange.get(key) ?? 0,
      }));

    res.json({ lessons });
  } catch (err) {
    next(err);
  }
};

export const nextLessonNumber: RequestHandler = async (_req, res, next) => {
  try {
    const [topWord, topSentence] = await Promise.all([
      Word.findOne().sort({ lessonNumberEnd: -1 }).select("lessonNumberEnd").lean(),
      Sentence.findOne({ isGrammarPractice: { $ne: true } })
        .sort({ lessonNumberEnd: -1 })
        .select("lessonNumberEnd")
        .lean(),
    ]);
    const max = Math.max(topWord?.lessonNumberEnd ?? 0, topSentence?.lessonNumberEnd ?? 0);
    res.json({ nextLessonNumber: max + 1 });
  } catch (err) {
    next(err);
  }
};
