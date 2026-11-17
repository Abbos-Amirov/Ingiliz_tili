import { Router } from "express";
import {
  checkPuzzle,
  checkStoryAnswer,
  checkVerbQuiz,
  getTextbookLesson,
  listTextbookBooks,
  listTextbookLessons,
} from "../controllers/textbook.controller";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.use(authMiddleware);

router.get("/books", listTextbookBooks);
router.get("/books/:level/lessons", listTextbookLessons);
router.get("/books/:level/lessons/:lessonNumber", getTextbookLesson);
router.post("/books/:level/lessons/:lessonNumber/puzzle-check", checkPuzzle);
router.post("/books/:level/lessons/:lessonNumber/verb-quiz", checkVerbQuiz);
router.post("/check-answer", checkStoryAnswer);

export default router;
