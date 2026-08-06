import { RequestHandler } from "express";
import { Types } from "mongoose";
import { IrregularVerb, IrregularVerbDoc } from "../models/IrregularVerb";
import { UserIrregularVerbProgress } from "../models/UserIrregularVerbProgress";
import { IRREGULAR_VERB_CATEGORIES, type IrregularVerbCategory } from "../config/irregularVerbs";
import { reviewWord } from "../services/srs.service";
import { bulkUploadIrregularVerbsFromCsv } from "../services/irregularVerbCsv.service";

export const checkIrregularVerb: RequestHandler = async (req, res, next) => {
  try {
    const word = String(req.query.word ?? "").trim().toLowerCase();
    if (!word) {
      res.status(400).json({ error: "word query param is required" });
      return;
    }
    const found = await IrregularVerb.findOne({
      $or: [{ base: word }, { past: word }, { participle: word }],
    });
    res.json(found ? { exists: true, verb: found } : { exists: false });
  } catch (err) {
    next(err);
  }
};

export const listIrregularVerbs: RequestHandler = async (req, res, next) => {
  try {
    const { category, search, limit = "500" } = req.query;
    const filter: Record<string, unknown> = {};
    if (category) filter.category = category;
    if (search) {
      const escaped = String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const re = new RegExp(escaped, "i");
      filter.$or = [{ base: re }, { past: re }, { participle: re }, { korean: re }];
    }
    const limitNum = Math.min(500, Math.max(1, Number(limit) || 500));
    const [verbs, total] = await Promise.all([
      IrregularVerb.find(filter).sort({ base: 1 }).limit(limitNum),
      IrregularVerb.countDocuments(filter),
    ]);
    res.json({ verbs, total });
  } catch (err) {
    next(err);
  }
};

export const createIrregularVerb: RequestHandler = async (req, res, next) => {
  try {
    const { base, past, participle, korean, category, frequency } = req.body ?? {};
    if (!base || !past || !participle || !korean) {
      res.status(400).json({ error: "base, past, participle and korean are required" });
      return;
    }
    const baseNorm = String(base).trim().toLowerCase();
    const existing = await IrregularVerb.findOne({ base: baseNorm });
    if (existing) {
      res.status(409).json({ error: "This irregular verb already exists", verb: existing });
      return;
    }
    const verb = await IrregularVerb.create({
      base: baseNorm,
      past: String(past).trim().toLowerCase(),
      participle: String(participle).trim().toLowerCase(),
      korean: String(korean).trim(),
      category: IRREGULAR_VERB_CATEGORIES.includes(category) ? category : "other",
      frequency: frequency === undefined || frequency === null || frequency === "" ? null : Number(frequency),
    });
    res.status(201).json({ verb });
  } catch (err) {
    next(err);
  }
};

export const updateIrregularVerb: RequestHandler = async (req, res, next) => {
  try {
    const body = { ...req.body };
    if (body.base !== undefined) body.base = String(body.base).trim().toLowerCase();
    if (body.past !== undefined) body.past = String(body.past).trim().toLowerCase();
    if (body.participle !== undefined) body.participle = String(body.participle).trim().toLowerCase();
    if (body.frequency === "") body.frequency = null;

    if (body.base) {
      const dup = await IrregularVerb.findOne({ base: body.base, _id: { $ne: req.params.id } });
      if (dup) {
        res.status(409).json({ error: "This irregular verb already exists", verb: dup });
        return;
      }
    }

    const verb = await IrregularVerb.findByIdAndUpdate(req.params.id, body, {
      new: true,
      runValidators: true,
    });
    if (!verb) {
      res.status(404).json({ error: "Irregular verb not found" });
      return;
    }
    res.json({ verb });
  } catch (err) {
    next(err);
  }
};

export const deleteIrregularVerb: RequestHandler = async (req, res, next) => {
  try {
    const verb = await IrregularVerb.findByIdAndDelete(req.params.id);
    if (!verb) {
      res.status(404).json({ error: "Irregular verb not found" });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

export const bulkUploadIrregularVerbs: RequestHandler = async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "CSV file is required (field name: file)" });
      return;
    }
    const result = await bulkUploadIrregularVerbsFromCsv(req.file.buffer);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const practiceBatch: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const limit = Math.min(20, Math.max(1, Number(req.query.limit) || 8));
    const now = new Date();

    const dueProgress = await UserIrregularVerbProgress.find({
      userId,
      $or: [{ pastDueDate: { $lte: now } }, { participleDueDate: { $lte: now } }],
    })
      .sort({ pastDueDate: 1 })
      .limit(limit)
      .populate<{ irregularVerbId: IrregularVerbDoc }>("irregularVerbId");

    let verbs = dueProgress.map((p) => p.irregularVerbId).filter((v): v is IrregularVerbDoc => Boolean(v));

    if (verbs.length < limit) {
      const allProgressIds = await UserIrregularVerbProgress.find({ userId }).distinct("irregularVerbId");
      const excludeIds = [...allProgressIds.map((id) => String(id)), ...verbs.map((v) => String(v._id))];
      const backfill = await IrregularVerb.aggregate<IrregularVerbDoc>([
        { $match: { _id: { $nin: excludeIds.map((id) => new Types.ObjectId(id)) } } },
        { $sample: { size: limit - verbs.length } },
      ]);
      verbs = [...verbs, ...backfill];
    }

    // Nothing due and nothing new left — offer bonus practice from already-seen verbs.
    let bonusPractice = false;
    if (verbs.length < limit) {
      const usedIds = verbs.map((v) => v._id);
      const bonus = await UserIrregularVerbProgress.aggregate<{ irregularVerbId: Types.ObjectId }>([
        { $match: { userId: new Types.ObjectId(userId), irregularVerbId: { $nin: usedIds } } },
        { $sample: { size: limit - verbs.length } },
      ]);
      if (bonus.length > 0) {
        const bonusVerbs = await IrregularVerb.find({ _id: { $in: bonus.map((b) => b.irregularVerbId) } });
        verbs = [...verbs, ...bonusVerbs];
        bonusPractice = true;
      }
    }

    res.json({ verbs, bonusPractice });
  } catch (err) {
    next(err);
  }
};

export const submitFormReview: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const { irregularVerbId, form, result } = req.body ?? {};
    if (
      !irregularVerbId ||
      (form !== "past" && form !== "participle") ||
      (result !== "correct" && result !== "wrong" && result !== "helped")
    ) {
      res.status(400).json({
        error: "irregularVerbId, form ('past'|'participle') and result ('correct'|'wrong'|'helped') are required",
      });
      return;
    }

    // Past and participle reviews for the same verb can arrive as two
    // near-simultaneous requests (both fields checked together) — findOne+create
    // would race on the first insert, so upsert the progress doc atomically.
    const progress = await UserIrregularVerbProgress.findOneAndUpdate(
      { userId, irregularVerbId },
      { $setOnInsert: { userId, irregularVerbId } },
      { upsert: true, new: true },
    );

    // A hint-assisted recall resets the SRS interval exactly like a wrong
    // answer — that form resurfaces tomorrow instead of drifting out further.
    const srsResult = result === "helped" ? "wrong" : result;

    if (form === "past") {
      const updated = reviewWord(
        {
          easeFactor: progress.pastEaseFactor,
          interval: progress.pastInterval,
          repetitions: progress.pastRepetitions,
          lapses: progress.pastLapses,
        },
        srsResult,
      );
      progress.pastEaseFactor = updated.easeFactor;
      progress.pastInterval = updated.interval;
      progress.pastRepetitions = updated.repetitions;
      progress.pastLapses = updated.lapses;
      progress.pastDueDate = updated.dueDate;
      progress.pastStatus = result;
      if (result === "helped") progress.pastHelpedCount += 1;
    } else {
      const updated = reviewWord(
        {
          easeFactor: progress.participleEaseFactor,
          interval: progress.participleInterval,
          repetitions: progress.participleRepetitions,
          lapses: progress.participleLapses,
        },
        srsResult,
      );
      progress.participleEaseFactor = updated.easeFactor;
      progress.participleInterval = updated.interval;
      progress.participleRepetitions = updated.repetitions;
      progress.participleLapses = updated.lapses;
      progress.participleDueDate = updated.dueDate;
      progress.participleStatus = result;
      if (result === "helped") progress.participleHelpedCount += 1;
    }

    await progress.save();
    res.json({ progress });
  } catch (err) {
    next(err);
  }
};

export const formDistractors: RequestHandler = async (req, res, next) => {
  try {
    const { irregularVerbId, form } = req.query;
    const count = Math.min(10, Math.max(1, Number(req.query.count) || 4));
    if (
      !irregularVerbId ||
      !Types.ObjectId.isValid(String(irregularVerbId)) ||
      (form !== "past" && form !== "participle")
    ) {
      res.status(400).json({ error: "Valid irregularVerbId and form ('past'|'participle') are required" });
      return;
    }
    const verb = await IrregularVerb.findById(irregularVerbId);
    if (!verb) {
      res.status(404).json({ error: "Irregular verb not found" });
      return;
    }

    const field = form as "past" | "participle";
    const correctValue = verb[field];
    const projectField = field === "past" ? "$past" : "$participle";

    function dedupeExcluding(values: string[], needed: number, into: Set<string>) {
      for (const v of values) {
        if (into.size >= needed) break;
        if (v.toLowerCase() !== correctValue.toLowerCase()) into.add(v);
      }
    }

    const picked = new Set<string>();

    // Prefer distractors from the same semantic category (e.g. other "movement" verbs).
    if (verb.category) {
      const sameCategory = await IrregularVerb.aggregate<{ value: string }>([
        { $match: { _id: { $ne: verb._id }, category: verb.category } },
        { $sample: { size: count * 3 } },
        { $project: { value: projectField } },
      ]);
      dedupeExcluding(sameCategory.map((d) => d.value), count, picked);
    }

    if (picked.size < count) {
      const more = await IrregularVerb.aggregate<{ value: string }>([
        { $match: { _id: { $ne: verb._id } } },
        { $sample: { size: (count - picked.size) * 3 } },
        { $project: { value: projectField } },
      ]);
      dedupeExcluding(more.map((d) => d.value), count, picked);
    }

    res.json({ distractors: Array.from(picked).slice(0, count) });
  } catch (err) {
    next(err);
  }
};
