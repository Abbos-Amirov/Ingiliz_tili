import { Router } from "express";
import { registerPushToken } from "../controllers/push.controller";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.post("/register", authMiddleware, registerPushToken);

export default router;
