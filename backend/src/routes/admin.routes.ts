import { Router } from "express";
import {
  aiAssistTranslate,
  aiAssistSentenceRoles,
  aiAssistIrregularVerb,
  unsplashSearch,
} from "../controllers/admin.controller";
import { adminDashboard, adminStudents } from "../controllers/adminDashboard.controller";
import {
  createBook,
  deleteBook,
  deleteLesson,
  getLesson,
  importStatus,
  listBooks,
  publishLesson,
  startImport,
  updateBook,
  updateLesson,
  uploadBookCover,
} from "../controllers/adminTextbook.controller";
import { authMiddleware } from "../middleware/auth";
import { imageUpload } from "../middleware/upload";
import { RequestHandler } from "express";
import { requireAdmin } from "../middleware/requireAdmin";

const router = Router();

router.post("/ai-assist/translate", authMiddleware, requireAdmin, aiAssistTranslate);
router.post("/ai-assist/sentence-roles", authMiddleware, requireAdmin, aiAssistSentenceRoles);
router.post("/ai-assist/irregular-verb", authMiddleware, requireAdmin, aiAssistIrregularVerb);
router.get("/unsplash-search", authMiddleware, requireAdmin, unsplashSearch);
router.get("/dashboard", authMiddleware, requireAdmin, adminDashboard);
router.get("/students", authMiddleware, requireAdmin, adminStudents);

// Multer errors (too large, too many files) as 400s with a readable message.
const images = (mw: RequestHandler): RequestHandler => (req, res, next) =>
  mw(req, res, (err?: unknown) => {
    if (!err) return next();
    const e = err as { code?: string; message?: string; status?: number };
    const message =
      e.code === "LIMIT_FILE_SIZE" ? "Each image must be under 10 MB." :
      e.code === "LIMIT_FILE_COUNT" ? "Up to 12 pages per import." :
      e.message || "Upload failed";
    res.status(e.status ?? 400).json({ error: message });
  });

const admin = [authMiddleware, requireAdmin];
router.get("/textbook/books", admin, listBooks);
router.post("/textbook/books", admin, createBook);
router.put("/textbook/books/:level", admin, updateBook);
router.delete("/textbook/books/:level", admin, deleteBook);
router.post("/textbook/books/:level/cover", admin, images(imageUpload.single("image")), uploadBookCover);
router.post("/textbook/import", admin, images(imageUpload.array("images", 12)), startImport);
router.get("/textbook/import/:id", admin, importStatus);
router.get("/textbook/lessons/:id", admin, getLesson);
router.put("/textbook/lessons/:id", admin, updateLesson);
router.post("/textbook/lessons/:id/publish", admin, publishLesson);
router.delete("/textbook/lessons/:id", admin, deleteLesson);

export default router;
