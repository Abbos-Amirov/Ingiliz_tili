import "dotenv/config";
import mongoose from "mongoose";
import { env } from "../src/config/env";
import { Sentence } from "../src/models/Sentence";
import { generateSentenceExplanation } from "../src/services/ai.service";

// One-time/occasional backfill for FEATURE 1 ("Gap tahlili / Chuqur
// tushuntirish") — generates deepExplanation for every existing sentence
// that doesn't have one yet, via the same AI endpoint the admin's "AI bilan
// chuqur tushuntirish yaratish" button calls. Idempotent: only touches
// sentences with deepExplanation === null. Set LIMIT to cap how many are
// processed in one run (useful for a first smoke-test before running it on
// the full curriculum).

const LIMIT = process.env.LIMIT ? Number(process.env.LIMIT) : undefined;

async function main() {
  await mongoose.connect(env.MONGODB_URI);
  console.log("Connected to MongoDB for deep-explanation generation");

  let query = Sentence.find({ deepExplanation: null });
  if (LIMIT) query = query.limit(LIMIT);
  const sentences = await query;
  console.log(`Sentences needing deep explanation: ${sentences.length}${LIMIT ? ` (limited to ${LIMIT})` : ""}`);

  let done = 0;
  let failed = 0;
  for (const s of sentences) {
    try {
      const suggestion = await generateSentenceExplanation(
        s.korean,
        s.words.map((w) => ({ text: w.text, role: w.role })),
        s.formula ?? "",
      );
      await Sentence.findByIdAndUpdate(s._id, { deepExplanation: suggestion });
      done++;
    } catch (err) {
      failed++;
      console.error(`\nFailed for sentence "${s.korean}" (${s._id}):`, err instanceof Error ? err.message : err);
    }
    process.stdout.write(`\r  done: ${done}, failed: ${failed}, remaining: ${sentences.length - done - failed}`);
  }
  console.log();

  console.log("Done.");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Deep-explanation generation failed:", err);
  process.exit(1);
});
