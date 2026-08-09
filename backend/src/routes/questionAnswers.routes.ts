import { Router } from "express";
import {
  listQuestionAnswerPairs,
  createQuestionAnswerPair,
  updateQuestionAnswerPair,
  deleteQuestionAnswerPair,
  aiSuggestQuestionAnswerPair,
} from "../controllers/questionAnswers.controller";
import { authMiddleware } from "../middleware/auth";
import { requireAdmin } from "../middleware/requireAdmin";

const router = Router();

router.get("/", listQuestionAnswerPairs);
router.post("/ai-suggest", authMiddleware, requireAdmin, aiSuggestQuestionAnswerPair);
router.post("/", authMiddleware, requireAdmin, createQuestionAnswerPair);
router.put("/:questionId", authMiddleware, requireAdmin, updateQuestionAnswerPair);
router.delete("/:questionId", authMiddleware, requireAdmin, deleteQuestionAnswerPair);

export default router;
