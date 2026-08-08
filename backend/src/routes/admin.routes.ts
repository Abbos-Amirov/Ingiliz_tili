import { Router } from "express";
import {
  aiAssistTranslate,
  aiAssistSentenceRoles,
  aiAssistIrregularVerb,
  unsplashSearch,
} from "../controllers/admin.controller";
import { authMiddleware } from "../middleware/auth";
import { requireAdmin } from "../middleware/requireAdmin";

const router = Router();

router.post("/ai-assist/translate", authMiddleware, requireAdmin, aiAssistTranslate);
router.post("/ai-assist/sentence-roles", authMiddleware, requireAdmin, aiAssistSentenceRoles);
router.post("/ai-assist/irregular-verb", authMiddleware, requireAdmin, aiAssistIrregularVerb);
router.get("/unsplash-search", authMiddleware, requireAdmin, unsplashSearch);

export default router;
