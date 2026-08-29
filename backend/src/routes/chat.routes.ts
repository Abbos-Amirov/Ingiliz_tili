import { Router } from "express";
import { sentenceChat, voiceChat } from "../controllers/chat.controller";
import { authMiddleware } from "../middleware/auth";
import { voiceUpload } from "../middleware/upload";

const router = Router();

router.post("/sentence", authMiddleware, sentenceChat);
router.post("/voice", authMiddleware, voiceUpload.single("audio"), voiceChat);

export default router;
