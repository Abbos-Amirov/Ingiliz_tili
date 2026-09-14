import { existsSync, mkdirSync } from "fs";
import path from "path";
import multer from "multer";

export const csvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const isCsv =
      file.mimetype === "text/csv" ||
      file.mimetype === "application/vnd.ms-excel" ||
      file.originalname.toLowerCase().endsWith(".csv");
    if (!isCsv) {
      cb(new Error("Only CSV files are allowed"));
      return;
    }
    cb(null, true);
  },
});

// Voice-chat recordings (see chat.controller.ts's voiceChat) — no
// fileFilter, since browsers' MediaRecorder produces different container
// formats (audio/webm, audio/mp4, audio/ogg) depending on platform, and
// OpenAI's transcription endpoint accepts all of them.
export const voiceUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Shadowing videos (see shadowing.controller.ts) — written straight to disk
// rather than buffered in memory like the uploads above, since a video can
// be tens of megabytes and this app runs on a small VPS. Persisted via a
// docker-compose bind mount (see backend/public/videos), same pattern as
// tts.service.ts's generated audio.
const VIDEOS_DIR = path.resolve(process.cwd(), "public/videos");
if (!existsSync(VIDEOS_DIR)) mkdirSync(VIDEOS_DIR, { recursive: true });

export const videoUpload = multer({
  storage: multer.diskStorage({
    destination: VIDEOS_DIR,
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || ".mp4";
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
    },
  }),
  limits: { fileSize: 200 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("video/")) {
      cb(new Error("Only video files are allowed"));
      return;
    }
    cb(null, true);
  },
});
