import { Router } from "express";
import {
  listMemoryAnchors,
  unplacedWords,
  nextForRecall,
  createMemoryAnchor,
  updateMemoryAnchor,
  deleteMemoryAnchor,
  submitRecallResult,
} from "../controllers/memoryAnchors.controller";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.use(authMiddleware);
router.get("/unplaced-words", unplacedWords);
router.get("/next-for-recall", nextForRecall);
router.get("/", listMemoryAnchors);
router.post("/", createMemoryAnchor);
router.put("/:id/recall-result", submitRecallResult);
router.put("/:id", updateMemoryAnchor);
router.delete("/:id", deleteMemoryAnchor);

export default router;
