import { Router } from "express";
import {
  listFunctionWords,
  getFunctionWord,
  createFunctionWord,
  updateFunctionWord,
  deleteFunctionWord,
  aiGenerateFunctionWord,
} from "../controllers/functionWords.controller";
import { authMiddleware } from "../middleware/auth";
import { requireAdmin } from "../middleware/requireAdmin";

const router = Router();

router.get("/", listFunctionWords);
router.get("/:id", getFunctionWord);
router.post("/ai-generate", authMiddleware, requireAdmin, aiGenerateFunctionWord);
router.post("/", authMiddleware, requireAdmin, createFunctionWord);
router.put("/:id", authMiddleware, requireAdmin, updateFunctionWord);
router.delete("/:id", authMiddleware, requireAdmin, deleteFunctionWord);

export default router;
