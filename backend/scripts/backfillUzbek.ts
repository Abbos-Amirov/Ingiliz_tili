import "dotenv/config";
import mongoose from "mongoose";
import { env } from "../src/config/env";
import { Word } from "../src/models/Word";
import { Sentence } from "../src/models/Sentence";
import { IrregularVerb } from "../src/models/IrregularVerb";
import { FunctionWord } from "../src/models/FunctionWord";
import { suggestTranslation, suggestIrregularVerb, translateShadowingSentence } from "../src/services/ai.service";

// One-time backfill for the "learn via Uzbek too" feature (see
// contentLocale.ts) — every Word/Sentence/IrregularVerb/FunctionWord
// created before this feature existed has korean but no uzbek. Reuses the
// SAME AI functions the admin's live "AI bilan taklif olish" buttons call
// (already battle-tested), just discarding the fields that already exist
// and only keeping the new uzbek ones. Idempotent: only touches documents
// where uzbek is still empty, so it's safe to re-run after an interruption
// or to pick up newly-added content later.
const CONCURRENCY = 10;

async function processInBatches<T>(items: T[], worker: (item: T) => Promise<void>) {
  let done = 0;
  for (let i = 0; i < items.length; i += CONCURRENCY) {
    const batch = items.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(batch.map(worker));
    results.forEach((r) => {
      if (r.status === "rejected") console.error("  item failed:", r.reason);
    });
    done += batch.length;
    process.stdout.write(`\r  ${done}/${items.length}`);
  }
  console.log();
}

async function backfillWords() {
  const words = await Word.find({ $or: [{ uzbek: null }, { uzbek: "" }] });
  console.log(`Words needing Uzbek: ${words.length}`);
  await processInBatches(words, async (w) => {
    const suggestion = await suggestTranslation(w.english);
    w.uzbek = suggestion.uzbek;
    if (!w.exampleSentenceUz) w.exampleSentenceUz = suggestion.exampleSentenceUz;
    await w.save();
  });
}

async function backfillSentences() {
  const sentences = await Sentence.find({ $or: [{ uzbek: null }, { uzbek: "" }] });
  console.log(`Sentences needing Uzbek: ${sentences.length}`);
  await processInBatches(sentences, async (s) => {
    const englishText = s.words.map((w) => w.text).join(" ");
    const { uz } = await translateShadowingSentence(englishText);
    s.uzbek = uz;
    await s.save();
  });
}

async function backfillIrregularVerbs() {
  const verbs = await IrregularVerb.find({ $or: [{ uzbek: null }, { uzbek: "" }] });
  console.log(`Irregular verbs needing Uzbek: ${verbs.length}`);
  await processInBatches(verbs, async (v) => {
    const suggestion = await suggestIrregularVerb(v.base);
    v.uzbek = suggestion.uzbek;
    await v.save();
  });
}

async function backfillFunctionWords() {
  const words = await FunctionWord.find({ $or: [{ uzbek: null }, { uzbek: "" }] });
  console.log(`Function words needing Uzbek: ${words.length}`);
  await processInBatches(words, async (w) => {
    const suggestion = await suggestTranslation(w.word);
    w.uzbek = suggestion.uzbek;
    await w.save();
  });
}

async function main() {
  await mongoose.connect(env.MONGODB_URI);
  console.log("Connected to MongoDB for Uzbek backfill");

  await backfillWords();
  await backfillSentences();
  await backfillIrregularVerbs();
  await backfillFunctionWords();

  console.log("Done.");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Uzbek backfill failed:", err);
  process.exit(1);
});
