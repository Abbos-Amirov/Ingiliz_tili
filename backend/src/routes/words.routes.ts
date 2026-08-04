import { Router } from "express";
import {
  listWords,
  getWord,
  createWord,
  updateWord,
  deleteWord,
  bulkUploadWords,
} from "../controllers/words.controller";
import { authMiddleware } from "../middleware/auth";
import { requireAdmin } from "../middleware/requireAdmin";
import { csvUpload } from "../middleware/upload";

const router = Router();

router.get("/", listWords);
router.get("/:id", getWord);
router.post("/bulk-upload", authMiddleware, requireAdmin, csvUpload.single("file"), bulkUploadWords);
router.post("/", authMiddleware, requireAdmin, createWord);
router.put("/:id", authMiddleware, requireAdmin, updateWord);
router.delete("/:id", authMiddleware, requireAdmin, deleteWord);

export default router;
