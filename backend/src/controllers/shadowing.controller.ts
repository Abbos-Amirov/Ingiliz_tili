import path from "path";
import { unlink } from "fs/promises";
import { RequestHandler } from "express";
import { ShadowingVideo } from "../models/ShadowingVideo";
import { transcribeVideoWordTimestamps } from "../services/transcription.service";
import { translateShadowingSentence, translateWordsBatch } from "../services/ai.service";
import { segmentTranscriptIntoSentences } from "../utils/sentenceSegmentation";
import { PUBLIC_BASE_URL } from "../config/env";

const VIDEOS_DIR = path.resolve(process.cwd(), "public/videos");

export const uploadShadowingVideoFile: RequestHandler = async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "video file is required (field name: video)" });
      return;
    }
    res.json({ videoUrl: `${PUBLIC_BASE_URL}/videos/${req.file.filename}`, filename: req.file.filename });
  } catch (err) {
    next(err);
  }
};

export const transcribeShadowingVideo: RequestHandler = async (req, res, next) => {
  try {
    const { filename } = req.body ?? {};
    if (!filename || typeof filename !== "string" || filename.includes("..") || filename.includes("/")) {
      res.status(400).json({ error: "A valid filename is required" });
      return;
    }
    const words = await transcribeVideoWordTimestamps(path.join(VIDEOS_DIR, filename));
    res.json({ words });
  } catch (err) {
    next(err);
  }
};

export const listShadowingVideos: RequestHandler = async (req, res, next) => {
  try {
    const { level } = req.query;
    const filter: Record<string, unknown> = {};
    if (level) filter.level = level;
    const videos = await ShadowingVideo.find(filter, { transcript: 0, sentences: 0 }).sort({ createdAt: -1 });
    res.json({ videos });
  } catch (err) {
    next(err);
  }
};

export const getShadowingVideo: RequestHandler = async (req, res, next) => {
  try {
    const video = await ShadowingVideo.findById(req.params.id);
    if (!video) {
      res.status(404).json({ error: "Video not found" });
      return;
    }
    res.json({ video });
  } catch (err) {
    next(err);
  }
};

export const createShadowingVideo: RequestHandler = async (req, res, next) => {
  try {
    const { title, videoUrl, level, duration, transcript } = req.body ?? {};
    if (!title || !videoUrl) {
      res.status(400).json({ error: "title and videoUrl are required" });
      return;
    }
    const video = await ShadowingVideo.create({
      title,
      videoUrl,
      level: level || "beginner",
      duration: Number(duration) || 0,
      transcript: Array.isArray(transcript) ? transcript : [],
    });
    res.status(201).json({ video });
  } catch (err) {
    next(err);
  }
};

export const updateShadowingVideo: RequestHandler = async (req, res, next) => {
  try {
    const video = await ShadowingVideo.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!video) {
      res.status(404).json({ error: "Video not found" });
      return;
    }
    res.json({ video });
  } catch (err) {
    next(err);
  }
};

// Segments the saved word-level transcript into sentences and translates
// each into Uzbek + Korean, AND separately translates every individual
// token (see ai.service.ts's translateWordsBatch) for the "So'zma-so'z
// tarjima" toggle — both stored on the video so the learner-facing player
// only ever reads a saved translation, never calls the AI live. Re-running
// replaces any previous translations.
export const translateShadowingContent: RequestHandler = async (req, res, next) => {
  try {
    const video = await ShadowingVideo.findById(req.params.id);
    if (!video) {
      res.status(404).json({ error: "Video not found" });
      return;
    }
    if (video.transcript.length === 0) {
      res.status(400).json({ error: "This video has no word transcript yet" });
      return;
    }

    const segments = segmentTranscriptIntoSentences(video.transcript);
    const [sentences, wordTranslations] = await Promise.all([
      Promise.all(
        segments.map(async (seg) => ({
          text: seg.text,
          startTime: seg.startTime,
          endTime: seg.endTime,
          translation: await translateShadowingSentence(seg.text),
        })),
      ),
      translateWordsBatch(video.transcript.map((w) => w.word)),
    ]);

    video.set("sentences", sentences);
    video.set(
      "transcript",
      video.transcript.map((w, i) => ({
        word: w.word,
        startTime: w.startTime,
        endTime: w.endTime,
        translationUz: wordTranslations[i].uz,
        translationKo: wordTranslations[i].ko,
      })),
    );
    await video.save();
    res.json({ video });
  } catch (err) {
    next(err);
  }
};

export const deleteShadowingVideo: RequestHandler = async (req, res, next) => {
  try {
    const video = await ShadowingVideo.findByIdAndDelete(req.params.id);
    if (!video) {
      res.status(404).json({ error: "Video not found" });
      return;
    }
    const filename = video.videoUrl.split("/").pop();
    if (filename) {
      await unlink(path.join(VIDEOS_DIR, filename)).catch(() => {});
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
