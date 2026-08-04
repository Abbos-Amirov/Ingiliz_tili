import { RequestHandler } from "express";
import { Word } from "../models/Word";
import { Sentence } from "../models/Sentence";

interface LessonSummary {
  lessonNumber: number;
  wordCount: number;
  sentenceCount: number;
}

export const listLessons: RequestHandler = async (_req, res, next) => {
  try {
    const [wordCounts, sentenceCounts] = await Promise.all([
      Word.aggregate<{ _id: number; count: number }>([
        { $group: { _id: "$lessonNumber", count: { $sum: 1 } } },
      ]),
      Sentence.aggregate<{ _id: number; count: number }>([
        { $group: { _id: "$lessonNumber", count: { $sum: 1 } } },
      ]),
    ]);

    const sentenceCountByLesson = new Map(sentenceCounts.map((s) => [s._id, s.count]));
    const lessonNumbers = new Set<number>([
      ...wordCounts.map((w) => w._id),
      ...sentenceCounts.map((s) => s._id),
    ]);

    const wordCountByLesson = new Map(wordCounts.map((w) => [w._id, w.count]));

    const lessons: LessonSummary[] = Array.from(lessonNumbers)
      .sort((a, b) => a - b)
      .map((lessonNumber) => ({
        lessonNumber,
        wordCount: wordCountByLesson.get(lessonNumber) ?? 0,
        sentenceCount: sentenceCountByLesson.get(lessonNumber) ?? 0,
      }));

    res.json({ lessons });
  } catch (err) {
    next(err);
  }
};

export const nextLessonNumber: RequestHandler = async (_req, res, next) => {
  try {
    const [topWord, topSentence] = await Promise.all([
      Word.findOne().sort({ lessonNumber: -1 }).select("lessonNumber").lean(),
      Sentence.findOne().sort({ lessonNumber: -1 }).select("lessonNumber").lean(),
    ]);
    const max = Math.max(topWord?.lessonNumber ?? 0, topSentence?.lessonNumber ?? 0);
    res.json({ nextLessonNumber: max + 1 });
  } catch (err) {
    next(err);
  }
};
