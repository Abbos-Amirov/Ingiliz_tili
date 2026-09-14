import { Router } from "express";
import {
  uploadShadowingVideoFile,
  transcribeShadowingVideo,
  listShadowingVideos,
  getShadowingVideo,
  createShadowingVideo,
  updateShadowingVideo,
  deleteShadowingVideo,
} from "../controllers/shadowing.controller";
import { authMiddleware } from "../middleware/auth";
import { requireAdmin } from "../middleware/requireAdmin";
import { videoUpload } from "../middleware/upload";

const router = Router();

router.get("/", authMiddleware, listShadowingVideos);
router.get("/:id", authMiddleware, getShadowingVideo);

router.post("/upload", authMiddleware, requireAdmin, videoUpload.single("video"), uploadShadowingVideoFile);
router.post("/transcribe", authMiddleware, requireAdmin, transcribeShadowingVideo);
router.post("/", authMiddleware, requireAdmin, createShadowingVideo);
router.put("/:id", authMiddleware, requireAdmin, updateShadowingVideo);
router.delete("/:id", authMiddleware, requireAdmin, deleteShadowingVideo);

export default router;
