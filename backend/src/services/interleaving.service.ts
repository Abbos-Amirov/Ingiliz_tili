import { Types } from "mongoose";
import { Word, WordDoc } from "../models/Word";

/**
 * Backfills a review batch with new (no-progress-record) words, preferring
 * words that share a category with the batch built so far so similar items
 * (go/come/run) get interleaved in the same round.
 */
export async function pickBackfillWords(
  excludeWordIds: string[],
  needed: number,
): Promise<WordDoc[]> {
  if (needed <= 0) return [];

  const toObjectIds = (ids: string[]) => ids.map((id) => new Types.ObjectId(id));

  const anchorCategories = await Word.find({ _id: { $nin: toObjectIds(excludeWordIds) } })
    .limit(1)
    .distinct("category");

  let picked: WordDoc[] = [];

  if (anchorCategories.length > 0) {
    picked = await Word.aggregate([
      { $match: { _id: { $nin: toObjectIds(excludeWordIds) }, category: anchorCategories[0] } },
      { $sample: { size: needed } },
    ]);
  }

  if (picked.length < needed) {
    const stillNeeded = needed - picked.length;
    const pickedIds = picked.map((w) => String(w._id));
    const more = await Word.aggregate([
      { $match: { _id: { $nin: toObjectIds([...excludeWordIds, ...pickedIds]) } } },
      { $sample: { size: stillNeeded } },
    ]);
    picked = [...picked, ...more];
  }

  return picked;
}
