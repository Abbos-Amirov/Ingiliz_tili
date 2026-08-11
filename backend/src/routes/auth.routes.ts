import { Router } from "express";
import { register, login, googleLogin, adminLogin, me } from "../controllers/auth.controller";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/google", googleLogin);
router.post("/admin-login", adminLogin);
router.get("/me", authMiddleware, me);

export default router;
