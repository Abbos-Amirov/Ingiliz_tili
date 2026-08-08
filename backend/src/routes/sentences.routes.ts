import { Router } from "express";
import {
  listSentences,
  getSentence,
  createSentence,
  updateSentence,
  deleteSentence,
  aiGenerateExplanation,
} from "../controllers/sentences.controller";
import { authMiddleware } from "../middleware/auth";
import { requireAdmin } from "../middleware/requireAdmin";

const router = Router();

router.get("/", listSentences);
router.get("/:id", getSentence);
router.post("/ai-generate-explanation", authMiddleware, requireAdmin, aiGenerateExplanation);
router.post("/", authMiddleware, requireAdmin, createSentence);
router.put("/:id", authMiddleware, requireAdmin, updateSentence);
router.delete("/:id", authMiddleware, requireAdmin, deleteSentence);

export default router;
