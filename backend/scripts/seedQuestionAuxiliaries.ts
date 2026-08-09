import "dotenv/config";
import mongoose from "mongoose";
import { env } from "../src/config/env";
import { FunctionWord } from "../src/models/FunctionWord";
import { generateFunctionWordContent } from "../src/services/ai.service";
import type { FunctionWordCategory } from "../src/config/functionWords";

// One-time/occasional seed for FEATURE 3 ("Savol yasovchi so'zlar") — adds
// the Yes/No question auxiliaries to the Function Words glossary, AI-fills
// their content, and manually sets the deterministic "do vs does"
// comparison card (grammar fact, not worth an AI call).

const SEED: { word: string; category: FunctionWordCategory; korean: string; order: number }[] = [
  { word: "do / does", category: "question_auxiliary", korean: "동사원형 앞에 오는 의문문 조동사", order: 1 },
  { word: "did", category: "question_auxiliary", korean: "과거 의문문 조동사", order: 2 },
  { word: "is / are", category: "question_auxiliary", korean: "be동사 의문문", order: 3 },
  { word: "can", category: "question_auxiliary", korean: "능력/허가를 묻는 의문문", order: 4 },
];

const FORCE = process.env.FORCE_REGENERATE === "1";

async function main() {
  await mongoose.connect(env.MONGODB_URI);
  console.log("Connected to MongoDB for question-auxiliary seeding");

  let created = 0;
  for (const item of SEED) {
    const existing = await FunctionWord.findOne({ word: item.word.toLowerCase() });
    if (!existing) {
      await FunctionWord.create({ ...item, word: item.word.toLowerCase() });
      created++;
    }
  }
  console.log(`Seeded ${created} new question auxiliaries (${SEED.length - created} already existed).`);

  const needsContent = FORCE
    ? await FunctionWord.find({ category: "question_auxiliary" })
    : await FunctionWord.find({ category: "question_auxiliary", "simpleExplanation.uz": "" });
  console.log(`Question auxiliaries needing AI content: ${needsContent.length}${FORCE ? " (forced regeneration)" : ""}`);
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

  // Deterministic comparison card — not AI-generated, so it's always exactly right.
  await FunctionWord.findOneAndUpdate(
    { word: "do / does" },
    {
      comparisonNote: {
        uz: "I/You/We/They + do — He/She/It + does",
        en: "I/You/We/They + do — He/She/It + does",
        ko: "I/You/We/They + do — He/She/It + does",
      },
      comparisonExamples: [
        { correct: "Do you like it?", wrong: null },
        { correct: "Does she like it?", wrong: "Does you like it?" },
      ],
    },
  );
  console.log("Set the 'do vs does' comparison card.");

  console.log("Done.");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Question-auxiliary seeding failed:", err);
  process.exit(1);
});
