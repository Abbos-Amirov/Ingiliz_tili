import { Router } from "express";
import {
  listGrammarTopics,
  getGrammarTopic,
  createGrammarTopic,
  updateGrammarTopic,
  deleteGrammarTopic,
  aiGenerateGrammarContent,
  submitQuizResult,
  getProgressSummary,
} from "../controllers/grammarTopics.controller";
import { authMiddleware } from "../middleware/auth";
import { requireAdmin } from "../middleware/requireAdmin";

const router = Router();

router.get("/", listGrammarTopics);
router.get("/progress-summary", authMiddleware, getProgressSummary);
router.get("/:id", getGrammarTopic);
router.post("/ai-generate", authMiddleware, requireAdmin, aiGenerateGrammarContent);
router.post("/:id/quiz-result", authMiddleware, submitQuizResult);
router.post("/", authMiddleware, requireAdmin, createGrammarTopic);
router.put("/:id", authMiddleware, requireAdmin, updateGrammarTopic);
router.delete("/:id", authMiddleware, requireAdmin, deleteGrammarTopic);

export default router;
