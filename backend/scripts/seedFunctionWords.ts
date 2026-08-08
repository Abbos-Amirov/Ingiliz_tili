import "dotenv/config";
import mongoose from "mongoose";
import { env } from "../src/config/env";
import { FunctionWord } from "../src/models/FunctionWord";
import { generateFunctionWordContent } from "../src/services/ai.service";
import type { FunctionWordCategory } from "../src/config/functionWords";

// One-time/occasional seed for FEATURE 2 ("Kichik so'zlar va so'roq
// so'zlari lug'ati") — creates the base 20-word glossary list, then fills in
// each word's simpleExplanation/usageTypes/commonMistakes via AI (same
// suggest_function_word tool the admin's "AI bilan to'ldirish" button
// calls). Idempotent: only inserts words that don't already exist, and only
// AI-fills words still missing content.

const SEED: { word: string; category: FunctionWordCategory; korean: string; order: number }[] = [
  { word: "to", category: "preposition", korean: "~로/에게 (또는 to부정사)", order: 1 },
  { word: "in", category: "preposition", korean: "~안에", order: 2 },
  { word: "on", category: "preposition", korean: "~위에", order: 3 },
  { word: "at", category: "preposition", korean: "~에서", order: 4 },
  { word: "by", category: "preposition", korean: "~까지/~로", order: 5 },
  { word: "for", category: "preposition", korean: "~을 위해", order: 6 },
  { word: "with", category: "preposition", korean: "~와 함께", order: 7 },
  { word: "from", category: "preposition", korean: "~로부터", order: 8 },
  { word: "of", category: "preposition", korean: "~의", order: 9 },
  { word: "about", category: "preposition", korean: "~에 대해", order: 10 },
  { word: "a", category: "article", korean: "하나의 (부정관사)", order: 11 },
  { word: "the", category: "article", korean: "그 (정관사)", order: 12 },
  { word: "what", category: "question_word", korean: "무엇", order: 13 },
  { word: "who", category: "question_word", korean: "누구", order: 14 },
  { word: "where", category: "question_word", korean: "어디", order: 15 },
  { word: "when", category: "question_word", korean: "언제", order: 16 },
  { word: "why", category: "question_word", korean: "왜", order: 17 },
  { word: "how", category: "question_word", korean: "어떻게", order: 18 },
  { word: "how much / how many", category: "question_word", korean: "얼마나", order: 19 },
  { word: "which", category: "question_word", korean: "어느", order: 20 },
];

const FORCE = process.env.FORCE_REGENERATE === "1";

async function main() {
  await mongoose.connect(env.MONGODB_URI);
  console.log("Connected to MongoDB for function-words seeding");

  let created = 0;
  for (const item of SEED) {
    const existing = await FunctionWord.findOne({ word: item.word.toLowerCase() });
    if (!existing) {
      await FunctionWord.create({ ...item, word: item.word.toLowerCase() });
      created++;
    }
  }
  console.log(`Seeded ${created} new function words (${SEED.length - created} already existed).`);

  const needsContent = FORCE
    ? await FunctionWord.find({})
    : await FunctionWord.find({ "simpleExplanation.uz": "" });
  console.log(`Function words needing AI content: ${needsContent.length}${FORCE ? " (forced regeneration)" : ""}`);
  let filled = 0;
  for (const fw of needsContent) {
    try {
      const suggestion = await generateFunctionWordContent(fw.word, fw.category as FunctionWordCategory);
      await FunctionWord.findByIdAndUpdate(fw._id, {
        simpleExplanation: suggestion.simpleExplanation,
        usageTypes: suggestion.usageTypes,
        commonMistakes: suggestion.commonMistakes,
      });
      filled++;
      process.stdout.write(`\r  AI-filled: ${filled}/${needsContent.length}`);
    } catch (err) {
      console.error(`\nFailed to AI-fill "${fw.word}":`, err);
    }
  }
  console.log();

  console.log("Done.");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Function-words seeding failed:", err);
  process.exit(1);
});
