import { Router } from "express";
import { registerPushToken, pushDebugLog } from "../controllers/push.controller";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.post("/register", authMiddleware, registerPushToken);
router.post("/debug", pushDebugLog);

export default router;
