import { Router } from "express";
import {
  nextBatch,
  submitReview,
  difficultWords,
  sentenceForWord,
  recallCheck,
  recallDistractors,
} from "../controllers/srs.controller";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.use(authMiddleware);
router.get("/next-batch", nextBatch);
router.post("/review", submitReview);
router.get("/difficult-words", difficultWords);
router.get("/sentence-for-word", sentenceForWord);
router.post("/recall-check", recallCheck);
router.get("/recall-distractors", recallDistractors);

export default router;
