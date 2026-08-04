import { Router } from "express";
import { listLessons, nextLessonNumber } from "../controllers/lessons.controller";
import { authMiddleware } from "../middleware/auth";
import { requireAdmin } from "../middleware/requireAdmin";

const router = Router();

router.get("/", listLessons);
router.get("/next-number", authMiddleware, requireAdmin, nextLessonNumber);

export default router;
