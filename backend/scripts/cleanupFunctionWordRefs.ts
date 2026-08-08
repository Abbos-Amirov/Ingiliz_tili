import "dotenv/config";
import mongoose from "mongoose";
import { env } from "../src/config/env";
import { Sentence } from "../src/models/Sentence";
import { FunctionWord } from "../src/models/FunctionWord";

// Nulls out any deepExplanation.wordBreakdown.functionWordRef that doesn't
// match an actual FunctionWord glossary entry — a safety net for older
// generateDeepExplanations.ts runs that predate the stricter validation in
// ai.service.ts's generateSentenceExplanation (models don't always honor
// enum constraints in tool schemas).

async function main() {
  await mongoose.connect(env.MONGODB_URI);
  const validWords = new Set((await FunctionWord.find({}, { word: 1 })).map((w) => w.word));

  const sentences = await Sentence.find({ deepExplanation: { $ne: null } });
  let fixed = 0;
  for (const s of sentences) {
    if (!s.deepExplanation) continue;
    let changed = false;
    const wordBreakdown = s.deepExplanation.wordBreakdown.map((wb) => {
      if (wb.functionWordRef && !validWords.has(wb.functionWordRef)) {
        changed = true;
        return { ...wb, functionWordRef: null };
      }
      return wb;
    });
    if (changed) {
      await Sentence.findByIdAndUpdate(s._id, { "deepExplanation.wordBreakdown": wordBreakdown });
      fixed++;
    }
  }
  console.log(`Fixed ${fixed} sentences with invalid functionWordRef values.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Cleanup failed:", err);
  process.exit(1);
});
