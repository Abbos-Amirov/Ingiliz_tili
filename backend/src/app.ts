import express from "express";
import cors from "cors";
import { env } from "./config/env";
import authRoutes from "./routes/auth.routes";
import wordsRoutes from "./routes/words.routes";
import sentencesRoutes from "./routes/sentences.routes";
import adminRoutes from "./routes/admin.routes";
import srsRoutes from "./routes/srs.routes";
import statsRoutes from "./routes/stats.routes";
import lessonsRoutes from "./routes/lessons.routes";
import configRoutes from "./routes/config.routes";
import chatRoutes from "./routes/chat.routes";
import irregularVerbsRoutes from "./routes/irregularVerbs.routes";
import grammarTopicsRoutes from "./routes/grammarTopics.routes";
import functionWordsRoutes from "./routes/functionWords.routes";
import questionAnswersRoutes from "./routes/questionAnswers.routes";
import memoryAnchorsRoutes from "./routes/memoryAnchors.routes";
import memoryJourneysRoutes from "./routes/memoryJourneys.routes";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

const allowedOrigins = env.CORS_ORIGIN.split(",").map((o) => o.trim());
app.use(cors({ origin: allowedOrigins }));
// Raised above the default 100kb to fit base64-encoded memory-anchor photos
// (see FEATURE "Xotira Saroyi" — images are stored inline, no file storage
// service is configured in this project).
app.use(express.json({ limit: "3mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/words", wordsRoutes);
app.use("/api/sentences", sentencesRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/srs", srsRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/lessons", lessonsRoutes);
app.use("/api/config", configRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/irregular-verbs", irregularVerbsRoutes);
app.use("/api/grammar-topics", grammarTopicsRoutes);
app.use("/api/function-words", functionWordsRoutes);
app.use("/api/question-answers", questionAnswersRoutes);
app.use("/api/memory-anchors", memoryAnchorsRoutes);
app.use("/api/memory-journeys", memoryJourneysRoutes);

app.use(errorHandler);

export default app;
