import { Router } from "express";
import {
  listMemoryJourneys,
  createMemoryJourney,
  getMemoryJourney,
  deleteMemoryJourney,
} from "../controllers/memoryJourneys.controller";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.use(authMiddleware);
router.get("/", listMemoryJourneys);
router.post("/", createMemoryJourney);
router.get("/:id", getMemoryJourney);
router.delete("/:id", deleteMemoryJourney);

export default router;
