export interface LessonRange {
  lessonNumber: number;
  lessonNumberEnd: number;
}

/**
 * Reads lessonNumber/lessonNumberEnd from a request body. lessonNumberEnd
 * defaults to lessonNumber when omitted (the common single-lesson case).
 * Returns null if the range is missing or invalid (start > end, non-positive, etc).
 */
export function parseLessonRange(body: Record<string, unknown>): LessonRange | null {
  const start = Number(body.lessonNumber);
  const endRaw = body.lessonNumberEnd;
  const end = endRaw === undefined || endRaw === null || endRaw === "" ? start : Number(endRaw);

  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
  if (start < 1 || end < 1) return null;
  if (start > end) return null;

  return { lessonNumber: start, lessonNumberEnd: end };
}

/** MongoDB filter fragment: documents whose [lessonNumber, lessonNumberEnd] range covers any of `lessonNumbers`. */
export function lessonRangeOverlapFilter(lessonNumbers: number[]): Record<string, unknown> {
  return {
    $or: lessonNumbers.map((n) => ({ lessonNumber: { $lte: n }, lessonNumberEnd: { $gte: n } })),
  };
}
