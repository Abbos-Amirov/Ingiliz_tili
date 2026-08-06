import { parse } from "csv-parse/sync";
import { IrregularVerb } from "../models/IrregularVerb";
import { IRREGULAR_VERB_CATEGORIES, type IrregularVerbCategory } from "../config/irregularVerbs";

export interface IrregularVerbCsvRow {
  base: string;
  past: string;
  participle: string;
  korean: string;
  category?: string;
  frequency?: string;
}

interface IrregularVerbInsert {
  base: string;
  past: string;
  participle: string;
  korean: string;
  category: IrregularVerbCategory;
  frequency: number | null;
}

export interface BulkUploadResult {
  inserted: number;
  skipped: number;
  errors: string[];
}

const ALLOWED_CATEGORIES = new Set<string>(IRREGULAR_VERB_CATEGORIES);

export async function bulkUploadIrregularVerbsFromCsv(buffer: Buffer): Promise<BulkUploadResult> {
  const rows = parse(buffer, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as IrregularVerbCsvRow[];

  const result: BulkUploadResult = { inserted: 0, skipped: 0, errors: [] };

  const existingBases = new Set(
    (await IrregularVerb.find({}, { base: 1 }).lean()).map((v) => v.base.toLowerCase()),
  );
  const seenInBatch = new Set<string>();
  const toInsert: IrregularVerbInsert[] = [];

  rows.forEach((row, index) => {
    const lineNo = index + 2; // header is line 1
    if (!row.base || !row.past || !row.participle || !row.korean) {
      result.errors.push(`Row ${lineNo}: missing base, past, participle or korean`);
      result.skipped++;
      return;
    }
    const baseKey = row.base.trim().toLowerCase();
    if (existingBases.has(baseKey) || seenInBatch.has(baseKey)) {
      result.skipped++;
      return;
    }
    seenInBatch.add(baseKey);

    const category = ALLOWED_CATEGORIES.has(row.category ?? "")
      ? (row.category as IrregularVerbCategory)
      : "other";
    const freq = Number(row.frequency);
    const frequency = row.frequency && Number.isFinite(freq) ? freq : null;

    toInsert.push({
      base: baseKey,
      past: row.past.trim().toLowerCase(),
      participle: row.participle.trim().toLowerCase(),
      korean: row.korean.trim(),
      category,
      frequency,
    });
  });

  if (toInsert.length > 0) {
    const inserted = await IrregularVerb.insertMany(toInsert, { ordered: false });
    result.inserted = inserted.length;
  }

  return result;
}
