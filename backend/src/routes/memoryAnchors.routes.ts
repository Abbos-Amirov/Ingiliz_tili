import { Router } from "express";
import {
  listMemoryAnchors,
  unplacedWords,
  nextForRecall,
  createMemoryAnchor,
  updateMemoryAnchor,
  deleteMemoryAnchor,
  submitRecallResult,
  suggestedPhotos,
  roomCounts,
  suggestRoomForWord,
} from "../controllers/memoryAnchors.controller";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.use(authMiddleware);
router.get("/unplaced-words", unplacedWords);
router.get("/next-for-recall", nextForRecall);
// Unlike /admin/unsplash-search, this is open to any authenticated user (not
// admin-gated) — regular users pick their own memory-anchor photo suggestions.
router.get("/suggested-photos", suggestedPhotos);
router.get("/room-counts", roomCounts);
router.get("/suggest-room", suggestRoomForWord);
router.get("/", listMemoryAnchors);
router.post("/", createMemoryAnchor);
router.put("/:id/recall-result", submitRecallResult);
router.put("/:id", updateMemoryAnchor);
router.delete("/:id", deleteMemoryAnchor);

export default router;
