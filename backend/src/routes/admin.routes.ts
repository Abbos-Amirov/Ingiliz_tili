import { Router } from "express";
import { aiAssistTranslate } from "../controllers/admin.controller";
import { authMiddleware } from "../middleware/auth";
import { requireAdmin } from "../middleware/requireAdmin";

const router = Router();

router.post("/ai-assist/translate", authMiddleware, requireAdmin, aiAssistTranslate);

export default router;
