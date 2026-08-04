import { RequestHandler } from "express";
import { UserStats } from "../models/UserStats";

export const getMyStats: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user!.id;
    let stats = await UserStats.findOne({ userId });
    if (!stats) {
      stats = await UserStats.create({ userId });
    }
    res.json({ stats });
  } catch (err) {
    next(err);
  }
};

export const dailyCheckIn: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user!.id;
    let stats = await UserStats.findOne({ userId });
    if (!stats) {
      stats = await UserStats.create({ userId });
    }

    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const yesterdayStr = new Date(today.getTime() - 86400000).toISOString().slice(0, 10);

    if (stats.lastActiveDate === todayStr) {
      // already checked in today, no change
    } else if (stats.lastActiveDate === yesterdayStr) {
      stats.currentStreak += 1;
      stats.wordsLearnedToday = 0;
    } else {
      stats.currentStreak = 1;
      stats.wordsLearnedToday = 0;
    }
    stats.lastActiveDate = todayStr;
    stats.longestStreak = Math.max(stats.longestStreak, stats.currentStreak);
    await stats.save();

    res.json({ stats });
  } catch (err) {
    next(err);
  }
};
