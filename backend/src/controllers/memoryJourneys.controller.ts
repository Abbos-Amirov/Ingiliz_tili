import { RequestHandler } from "express";
import { Types } from "mongoose";
import { MemoryJourney } from "../models/MemoryJourney";
import { MemoryAnchor } from "../models/MemoryAnchor";
import { WordDoc } from "../models/Word";

export const listMemoryJourneys: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const journeys = await MemoryJourney.find({ userId }).sort({ createdAt: -1 });
    const counts = await MemoryAnchor.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $match: { userId: new Types.ObjectId(userId), journeyId: { $ne: null } } },
      { $group: { _id: "$journeyId", count: { $sum: 1 } } },
    ]);
    const countByJourneyId = new Map(counts.map((c) => [String(c._id), c.count]));
    const withCounts = journeys.map((j) => ({
      ...j.toObject(),
      stopCount: countByJourneyId.get(String(j._id)) ?? 0,
    }));
    res.json({ journeys: withCounts });
  } catch (err) {
    next(err);
  }
};

export const createMemoryJourney: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const { title, description } = req.body ?? {};
    if (!title || typeof title !== "string" || !title.trim()) {
      res.status(400).json({ error: "title is required" });
      return;
    }
    const journey = await MemoryJourney.create({ userId, title: title.trim(), description: description ?? "" });
    res.status(201).json({ journey });
  } catch (err) {
    next(err);
  }
};

export const getMemoryJourney: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const journey = await MemoryJourney.findOne({ _id: id, userId });
    if (!journey) {
      res.status(404).json({ error: "Journey not found" });
      return;
    }
    const anchors = await MemoryAnchor.find({ userId, journeyId: id })
      .sort({ journeyOrder: 1 })
      .populate<{ wordId: WordDoc }>("wordId");
    res.json({ journey, anchors });
  } catch (err) {
    next(err);
  }
};

export const deleteMemoryJourney: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const journey = await MemoryJourney.findOneAndDelete({ _id: id, userId });
    if (!journey) {
      res.status(404).json({ error: "Journey not found" });
      return;
    }
    // The anchors themselves (photos/descriptions) survive — only their
    // journey placement is cleared — so deleting a journey never deletes a
    // user's saved memory anchors.
    await MemoryAnchor.updateMany({ userId, journeyId: id }, { journeyId: null, journeyOrder: null });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
