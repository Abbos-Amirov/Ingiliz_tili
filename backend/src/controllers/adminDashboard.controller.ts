import { RequestHandler } from "express";
import { MemoryAnchor } from "../models/MemoryAnchor";
import { Sentence } from "../models/Sentence";
import { ShadowingVideo } from "../models/ShadowingVideo";
import { TextbookLesson } from "../models/TextbookLesson";
import { User } from "../models/User";
import { UserGrammarProgress } from "../models/UserGrammarProgress";
import { UserLessonProgress } from "../models/UserLessonProgress";
import { UserStats } from "../models/UserStats";
import { UserWordProgress } from "../models/UserWordProgress";
import { Word } from "../models/Word";

// Admin dashboard — every number here is computed from real data in the
// database (no placeholder metrics). "Students" are accounts with role user.

const DAY = 86_400_000;

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 100);
}

// GET /api/admin/dashboard
export const adminDashboard: RequestHandler = async (_req, res, next) => {
  try {
    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const prevMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    const weekAgo = isoDay(new Date(now.getTime() - 6 * DAY));
    const prevWeekStart = isoDay(new Date(now.getTime() - 13 * DAY));
    const today = isoDay(now);
    const yearAgo = new Date(now.getTime() - 365 * DAY);

    const studentFilter = { role: "user" };

    const [
      totalStudents,
      newThisMonth,
      newPrevMonth,
      studentsBeforeYear,
      signupsByDay,
      statsAgg,
      activeWeek,
      activePrevWeek,
      activeToday,
      lessonAgg,
      wordProgressCount,
      grammarProgressCount,
      anchorCount,
      recent,
      topLearners,
      content,
    ] = await Promise.all([
      User.countDocuments(studentFilter),
      User.countDocuments({ ...studentFilter, createdAt: { $gte: monthStart } }),
      User.countDocuments({ ...studentFilter, createdAt: { $gte: prevMonthStart, $lt: monthStart } }),
      User.countDocuments({ ...studentFilter, createdAt: { $lt: yearAgo } }),
      User.aggregate<{ _id: string; count: number }>([
        { $match: { ...studentFilter, createdAt: { $gte: yearAgo } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      UserStats.aggregate<{ _id: null; words: number }>([{ $group: { _id: null, words: { $sum: "$totalWordsLearned" } } }]),
      UserStats.countDocuments({ lastActiveDate: { $gte: weekAgo } }),
      UserStats.countDocuments({ lastActiveDate: { $gte: prevWeekStart, $lt: weekAgo } }),
      UserStats.countDocuments({ lastActiveDate: today }),
      UserLessonProgress.aggregate<{ _id: null; answers: number; correct: number; exercises: number }>([
        {
          $group: {
            _id: null,
            answers: { $sum: { $size: "$storyAnswers" } },
            correct: {
              $sum: { $size: { $filter: { input: "$storyAnswers", as: "a", cond: { $eq: ["$$a.isCorrect", true] } } } },
            },
            exercises: { $sum: { $size: "$completedExercises" } },
          },
        },
      ]),
      UserWordProgress.countDocuments(),
      UserGrammarProgress.countDocuments(),
      MemoryAnchor.countDocuments(),
      User.find(studentFilter).sort({ createdAt: -1 }).limit(5).select("displayName email createdAt").lean(),
      UserStats.find({ currentStreak: { $gt: 0 } })
        .sort({ currentStreak: -1, totalWordsLearned: -1 })
        .limit(5)
        .populate<{ userId: { displayName: string; email: string; role: string } | null }>("userId", "displayName email role")
        .lean(),
      Promise.all([Word.countDocuments(), Sentence.countDocuments(), TextbookLesson.countDocuments(), ShadowingVideo.countDocuments()]),
    ]);

    // Cumulative student count per day for the last 365 days.
    const perDay = new Map(signupsByDay.map((d) => [d._id, d.count]));
    const growth: { date: string; total: number }[] = [];
    let running = studentsBeforeYear;
    for (let i = 364; i >= 0; i--) {
      const day = isoDay(new Date(now.getTime() - i * DAY));
      running += perDay.get(day) ?? 0;
      growth.push({ date: day, total: running });
    }

    const recentIds = recent.map((u) => u._id);
    const recentStats = await UserStats.find({ userId: { $in: recentIds } }).select("userId lastActiveDate currentStreak").lean();
    const statsByUser = new Map(recentStats.map((s) => [String(s.userId), s]));

    const lessons = lessonAgg[0] ?? { answers: 0, correct: 0, exercises: 0 };
    res.json({
      totals: {
        students: totalStudents,
        newThisMonth,
        studentsChange: pctChange(newThisMonth, newPrevMonth),
        activeWeek,
        activeWeekChange: pctChange(activeWeek, activePrevWeek),
        activeToday,
        wordsLearned: statsAgg[0]?.words ?? 0,
        textbookAnswers: lessons.answers,
        textbookCorrect: lessons.correct,
      },
      growth,
      // Where learners spend their effort (records per area).
      activity: [
        { key: "words", count: wordProgressCount },
        { key: "textbook", count: lessons.answers + lessons.exercises },
        { key: "grammar", count: grammarProgressCount },
        { key: "palace", count: anchorCount },
      ],
      recentStudents: recent.map((u) => {
        const s = statsByUser.get(String(u._id));
        return {
          id: String(u._id),
          displayName: u.displayName,
          email: u.email,
          createdAt: u.createdAt,
          lastActiveDate: s?.lastActiveDate ?? null,
          active: !!s?.lastActiveDate && s.lastActiveDate >= weekAgo,
        };
      }),
      topLearners: topLearners
        .filter((s) => s.userId && s.userId.role === "user")
        .map((s) => ({
          displayName: s.userId!.displayName,
          email: s.userId!.email,
          currentStreak: s.currentStreak,
          totalWordsLearned: s.totalWordsLearned,
          lastActiveDate: s.lastActiveDate,
        })),
      content: { words: content[0], sentences: content[1], lessons: content[2], videos: content[3] },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/students?search=&page=1
export const adminStudents: RequestHandler = async (req, res, next) => {
  try {
    const PAGE_SIZE = 20;
    const page = Math.max(1, Number(req.query.page) || 1);
    const search = typeof req.query.search === "string" ? req.query.search.trim().slice(0, 100) : "";
    const filter: Record<string, unknown> = { role: "user" };
    if (search) {
      const rx = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
      filter.$or = [{ displayName: rx }, { email: rx }];
    }
    const [total, users] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * PAGE_SIZE)
        .limit(PAGE_SIZE)
        .select("displayName email createdAt googleId")
        .lean(),
    ]);
    const ids = users.map((u) => u._id);
    const [stats, lessonProgress] = await Promise.all([
      UserStats.find({ userId: { $in: ids } }).lean(),
      UserLessonProgress.find({ userId: { $in: ids } }).select("userId storyAnswers completedExercises").lean(),
    ]);
    const statsBy = new Map(stats.map((s) => [String(s.userId), s]));
    const lessonBy = new Map<string, { answers: number; exercises: number }>();
    for (const p of lessonProgress) {
      const key = String(p.userId);
      const cur = lessonBy.get(key) ?? { answers: 0, exercises: 0 };
      cur.answers += p.storyAnswers.length;
      cur.exercises += p.completedExercises.length;
      lessonBy.set(key, cur);
    }
    const weekAgo = isoDay(new Date(Date.now() - 6 * DAY));
    res.json({
      total,
      page,
      pageSize: PAGE_SIZE,
      students: users.map((u) => {
        const s = statsBy.get(String(u._id));
        const l = lessonBy.get(String(u._id));
        return {
          id: String(u._id),
          displayName: u.displayName,
          email: u.email,
          createdAt: u.createdAt,
          google: !!u.googleId,
          lastActiveDate: s?.lastActiveDate ?? null,
          active: !!s?.lastActiveDate && s.lastActiveDate >= weekAgo,
          currentStreak: s?.currentStreak ?? 0,
          totalWordsLearned: s?.totalWordsLearned ?? 0,
          textbookAnswers: l?.answers ?? 0,
          textbookExercises: l?.exercises ?? 0,
        };
      }),
    });
  } catch (err) {
    next(err);
  }
};
