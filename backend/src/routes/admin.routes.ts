import { Router } from "express";
import { aiAssistTranslate, aiAssistSentenceRoles } from "../controllers/admin.controller";
import { authMiddleware } from "../middleware/auth";
import { requireAdmin } from "../middleware/requireAdmin";

const router = Router();

router.post("/ai-assist/translate", authMiddleware, requireAdmin, aiAssistTranslate);
router.post("/ai-assist/sentence-roles", authMiddleware, requireAdmin, aiAssistSentenceRoles);

export default router;
