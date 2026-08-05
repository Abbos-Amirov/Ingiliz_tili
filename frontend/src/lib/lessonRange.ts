export interface LessonRange {
  lessonNumber: number;
  lessonNumberEnd: number;
}

/** Parses "7" or "34-37" (spaces around the dash are tolerated) into a lesson range. */
export function parseLessonRangeText(text: string): LessonRange | null {
  const match = text.trim().match(/^(\d+)\s*(?:-\s*(\d+))?$/);
  if (!match) return null;
  const lessonNumber = Number(match[1]);
  const lessonNumberEnd = match[2] !== undefined ? Number(match[2]) : lessonNumber;
  if (lessonNumber < 1 || lessonNumberEnd < lessonNumber) return null;
  return { lessonNumber, lessonNumberEnd };
}

/** Formats a lesson range back into text: "7" when single, "34-37" when a range. */
export function formatLessonRange(lessonNumber: number, lessonNumberEnd: number): string {
  return lessonNumber === lessonNumberEnd ? String(lessonNumber) : `${lessonNumber}-${lessonNumberEnd}`;
}
