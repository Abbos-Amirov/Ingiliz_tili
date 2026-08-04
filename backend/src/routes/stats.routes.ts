import { Router } from "express";
import { getMyStats, dailyCheckIn } from "../controllers/stats.controller";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.use(authMiddleware);
router.get("/me", getMyStats);
router.post("/daily-check-in", dailyCheckIn);

export default router;
