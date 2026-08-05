import { Router } from "express";
import { sentenceChat } from "../controllers/chat.controller";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.post("/sentence", authMiddleware, sentenceChat);

export default router;
