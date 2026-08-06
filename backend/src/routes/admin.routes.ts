import { Router } from "express";
import { aiAssistTranslate, aiAssistSentenceRoles, aiAssistIrregularVerb } from "../controllers/admin.controller";
import { authMiddleware } from "../middleware/auth";
import { requireAdmin } from "../middleware/requireAdmin";

const router = Router();

router.post("/ai-assist/translate", authMiddleware, requireAdmin, aiAssistTranslate);
router.post("/ai-assist/sentence-roles", authMiddleware, requireAdmin, aiAssistSentenceRoles);
router.post("/ai-assist/irregular-verb", authMiddleware, requireAdmin, aiAssistIrregularVerb);

export default router;
