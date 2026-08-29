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
