import { Router } from "express";
import {
  checkPuzzle,
  checkStoryAnswer,
  checkVerbQuiz,
  getTextbookLesson,
  listTextbookLessons,
} from "../controllers/textbook.controller";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.use(authMiddleware);

router.get("/lessons", listTextbookLessons);
router.get("/lessons/:lessonNumber", getTextbookLesson);
router.post("/lessons/:lessonNumber/puzzle-check", checkPuzzle);
router.post("/lessons/:lessonNumber/verb-quiz", checkVerbQuiz);
router.post("/check-answer", checkStoryAnswer);

export default router;
