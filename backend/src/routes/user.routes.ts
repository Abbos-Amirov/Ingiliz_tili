import { Router } from "express";
import { mistakeStats } from "../controllers/textbook.controller";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.use(authMiddleware);

router.get("/mistake-stats", mistakeStats);

export default router;
