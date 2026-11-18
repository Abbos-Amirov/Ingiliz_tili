import type { TextbookLessonSeed } from "./types";
import { lesson01 } from "./lesson01";
import { lesson02 } from "./lesson02";

// Add each new textbook lesson here; syncTextbookLessons() upserts them all
// by lessonNumber on server start.
export const TEXTBOOK_LESSONS: TextbookLessonSeed[] = [lesson01, lesson02];
