import { Router } from "express";
import { getLevelsConfig } from "../controllers/config.controller";

const router = Router();

router.get("/levels", getLevelsConfig);

export default router;
