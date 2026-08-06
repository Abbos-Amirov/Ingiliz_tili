import { Router } from "express";
import {
  checkIrregularVerb,
  listIrregularVerbs,
  createIrregularVerb,
  updateIrregularVerb,
  deleteIrregularVerb,
  bulkUploadIrregularVerbs,
  practiceBatch,
  submitFormReview,
  formDistractors,
} from "../controllers/irregularVerbs.controller";
import { authMiddleware } from "../middleware/auth";
import { requireAdmin } from "../middleware/requireAdmin";
import { csvUpload } from "../middleware/upload";

const router = Router();

router.get("/", listIrregularVerbs);
router.get("/check", authMiddleware, requireAdmin, checkIrregularVerb);
router.get("/practice-batch", authMiddleware, practiceBatch);
router.get("/distractors", authMiddleware, formDistractors);
router.post("/review", authMiddleware, submitFormReview);
router.post("/bulk-upload", authMiddleware, requireAdmin, csvUpload.single("file"), bulkUploadIrregularVerbs);
router.post("/", authMiddleware, requireAdmin, createIrregularVerb);
router.put("/:id", authMiddleware, requireAdmin, updateIrregularVerb);
router.delete("/:id", authMiddleware, requireAdmin, deleteIrregularVerb);

export default router;
