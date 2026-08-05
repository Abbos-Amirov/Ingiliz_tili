import { parse } from "csv-parse/sync";
import { Word } from "../models/Word";
import type { LessonRange } from "../utils/lessonRange";

export interface WordCsvRow {
  english: string;
  korean: string;
  exampleSentenceEn?: string;
  exampleSentenceKo?: string;
  category?: string;
  difficulty?: string;
  lessonNumber?: string;
  lessonNumberEnd?: string;
}

interface WordInsert {
  english: string;
  korean: string;
  exampleSentenceEn: string;
  exampleSentenceKo: string;
  category: string;
  difficulty: string;
  lessonNumber: number;
  lessonNumberEnd: number;
}

export interface BulkUploadResult {
  inserted: number;
  skipped: number;
  errors: string[];
}

const ALLOWED_DIFFICULTIES = new Set(["beginner", "intermediate", "advanced"]);

export async function bulkUploadWordsFromCsv(
  buffer: Buffer,
  defaultLessonRange: LessonRange,
): Promise<BulkUploadResult> {
  const rows = parse(buffer, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as WordCsvRow[];

  const result: BulkUploadResult = { inserted: 0, skipped: 0, errors: [] };

  const existingPairs = new Set(
    (await Word.find({}, { english: 1, korean: 1 }).lean()).map(
      (w) => `${w.english.toLowerCase()}::${w.korean}`,
    ),
  );

  const seenInBatch = new Set<string>();
  const toInsert: WordInsert[] = [];

  rows.forEach((row, index) => {
    const lineNo = index + 2; // header is line 1
    if (!row.english || !row.korean) {
      result.errors.push(`Row ${lineNo}: missing english or korean`);
      result.skipped++;
      return;
    }
    const key = `${row.english.trim().toLowerCase()}::${row.korean.trim()}`;
    if (existingPairs.has(key) || seenInBatch.has(key)) {
      result.skipped++;
      return;
    }
    seenInBatch.add(key);
    const difficulty = ALLOWED_DIFFICULTIES.has(row.difficulty ?? "") ? (row.difficulty as string) : "beginner";

    const parsedStart = Number(row.lessonNumber);
    const lessonNumber = Number.isFinite(parsedStart) && parsedStart > 0 ? parsedStart : defaultLessonRange.lessonNumber;
    const parsedEnd = Number(row.lessonNumberEnd);
    const lessonNumberEnd =
      Number.isFinite(parsedEnd) && parsedEnd >= lessonNumber
        ? parsedEnd
        : Number.isFinite(parsedStart) && parsedStart > 0
          ? lessonNumber
          : defaultLessonRange.lessonNumberEnd;

    toInsert.push({
      english: row.english.trim(),
      korean: row.korean.trim(),
      exampleSentenceEn: row.exampleSentenceEn?.trim() ?? "",
      exampleSentenceKo: row.exampleSentenceKo?.trim() ?? "",
      category: row.category?.trim() || "general",
      difficulty,
      lessonNumber,
      lessonNumberEnd,
    });
  });

  if (toInsert.length > 0) {
    const inserted = await Word.insertMany(toInsert, { ordered: false });
    result.inserted = inserted.length;
  }

  return result;
}
