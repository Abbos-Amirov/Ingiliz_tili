import { RequestHandler } from "express";
import { Types } from "mongoose";
import { MemoryAnchor, MemoryAnchorDoc } from "../models/MemoryAnchor";
import { UserWordProgress } from "../models/UserWordProgress";
import { Word, WordDoc } from "../models/Word";
import { reviewWord } from "../services/srs.service";

// Base64 data URIs run ~33% larger than the raw bytes they encode, so this
// caps the encoded string comfortably above the ~500KB post-compression
// target the frontend aims for, while still rejecting anything absurd.
const MAX_IMAGE_BASE64_LENGTH = 900_000;

// Every query below filters by `userId: req.user!.id` directly rather than
// fetching-then-checking — see FEATURE spec's privacy requirement that no
// user's memory anchors (personal photos) are ever reachable by another user.

export const listMemoryAnchors: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const { journeyId } = req.query;
    const filter: Record<string, unknown> = { userId };
    if (journeyId && typeof journeyId === "string" && Types.ObjectId.isValid(journeyId)) {
      filter.journeyId = journeyId;
    }
    const anchors = await MemoryAnchor.find(filter)
      .sort({ journeyOrder: 1, createdAt: -1 })
      .populate<{ wordId: WordDoc }>("wordId");
    res.json({ anchors });
  } catch (err) {
    next(err);
  }
};

export const unplacedWords: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const learnedWordIds = await UserWordProgress.find({ userId, repetitions: { $gte: 1 } }).distinct("wordId");
    const anchoredWordIds = await MemoryAnchor.find({ userId }).distinct("wordId");
    const anchoredSet = new Set(anchoredWordIds.map((id) => String(id)));
    const unplacedIds = learnedWordIds.filter((id) => !anchoredSet.has(String(id)));
    const words = await Word.find({ _id: { $in: unplacedIds } });
    res.json({ words });
  } catch (err) {
    next(err);
  }
};

export const nextForRecall: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user!.id;

    const due = await MemoryAnchor.findOne({
      userId,
      dueDate: { $lte: new Date() },
    })
      .sort({ dueDate: 1 })
      .populate<{ wordId: WordDoc }>("wordId");

    let anchor = due;
    if (!anchor) {
      const [sampled] = await MemoryAnchor.aggregate<MemoryAnchorDoc>([
        { $match: { userId: new Types.ObjectId(userId) } },
        { $sample: { size: 1 } },
      ]);
      if (sampled) {
        anchor = await MemoryAnchor.findById(sampled._id).populate<{ wordId: WordDoc }>("wordId");
      }
    }

    res.json({ anchor });
  } catch (err) {
    next(err);
  }
};

export const createMemoryAnchor: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const { wordId, imageBase64, textDescription, journeyId, journeyOrder } = req.body ?? {};

    if (!wordId || !Types.ObjectId.isValid(wordId)) {
      res.status(400).json({ error: "Valid wordId is required" });
      return;
    }
    if (!imageBase64 && !textDescription) {
      res.status(400).json({ error: "Either imageBase64 or textDescription is required" });
      return;
    }
    if (imageBase64 && imageBase64.length > MAX_IMAGE_BASE64_LENGTH) {
      res.status(400).json({ error: "Image is too large — please compress it further" });
      return;
    }
    const word = await Word.findById(wordId);
    if (!word) {
      res.status(404).json({ error: "Word not found" });
      return;
    }

    // Upsert: re-placing a word replaces its existing anchor rather than
    // erroring, matching the unique (userId, wordId) index.
    const anchor = await MemoryAnchor.findOneAndUpdate(
      { userId, wordId },
      {
        userId,
        wordId,
        imageUrl: imageBase64 ?? null,
        textDescription: textDescription ?? null,
        journeyId: journeyId && Types.ObjectId.isValid(journeyId) ? journeyId : null,
        journeyOrder: typeof journeyOrder === "number" ? journeyOrder : null,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    res.status(201).json({ anchor });
  } catch (err) {
    next(err);
  }
};

export const updateMemoryAnchor: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { imageBase64, textDescription, journeyId, journeyOrder } = req.body ?? {};

    if (imageBase64 && imageBase64.length > MAX_IMAGE_BASE64_LENGTH) {
      res.status(400).json({ error: "Image is too large — please compress it further" });
      return;
    }

    const update: Record<string, unknown> = {};
    if (imageBase64 !== undefined) update.imageUrl = imageBase64;
    if (textDescription !== undefined) update.textDescription = textDescription;
    if (journeyId !== undefined) update.journeyId = journeyId && Types.ObjectId.isValid(journeyId) ? journeyId : null;
    if (journeyOrder !== undefined) update.journeyOrder = journeyOrder;

    const anchor = await MemoryAnchor.findOneAndUpdate({ _id: id, userId }, update, { new: true });
    if (!anchor) {
      res.status(404).json({ error: "Memory anchor not found" });
      return;
    }
    res.json({ anchor });
  } catch (err) {
    next(err);
  }
};

export const deleteMemoryAnchor: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const anchor = await MemoryAnchor.findOneAndDelete({ _id: id, userId });
    if (!anchor) {
      res.status(404).json({ error: "Memory anchor not found" });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

export const submitRecallResult: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { result } = req.body ?? {};
    if (result !== "correct" && result !== "wrong") {
      res.status(400).json({ error: "result ('correct'|'wrong') is required" });
      return;
    }

    const anchor = await MemoryAnchor.findOne({ _id: id, userId }).populate<{ wordId: WordDoc }>("wordId");
    if (!anchor) {
      res.status(404).json({ error: "Memory anchor not found" });
      return;
    }

    const updated = reviewWord(
      {
        easeFactor: anchor.easeFactor,
        interval: anchor.recallSrsInterval,
        repetitions: anchor.repetitions,
        lapses: anchor.lapses,
      },
      result,
    );

    anchor.easeFactor = updated.easeFactor;
    anchor.recallSrsInterval = updated.interval;
    anchor.repetitions = updated.repetitions;
    anchor.lapses = updated.lapses;
    anchor.dueDate = updated.dueDate;
    anchor.lastRecalledAt = new Date();
    if (result === "correct") anchor.recallCorrectCount += 1;
    else anchor.recallIncorrectCount += 1;
    await anchor.save();

    res.json({ anchor, correctAnswer: (anchor.wordId as unknown as WordDoc).english });
  } catch (err) {
    next(err);
  }
};
