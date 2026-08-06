import "dotenv/config";
import mongoose from "mongoose";
import { env } from "../src/config/env";
import { IrregularVerb } from "../src/models/IrregularVerb";

// Additive-only seed: upserts by `base`, never deletes existing data.
const verbs = [
  { base: "go", past: "went", participle: "gone", korean: "가다", category: "movement", frequency: 1 },
  { base: "have", past: "had", participle: "had", korean: "가지다", category: "possession", frequency: 2 },
  { base: "say", past: "said", participle: "said", korean: "말하다", category: "communication", frequency: 3 },
  { base: "come", past: "came", participle: "come", korean: "오다", category: "movement", frequency: 4 },
  { base: "know", past: "knew", participle: "known", korean: "알다", category: "thinking", frequency: 5 },
  { base: "see", past: "saw", participle: "seen", korean: "보다", category: "other", frequency: 6 },
  { base: "think", past: "thought", participle: "thought", korean: "생각하다", category: "thinking", frequency: 7 },
  { base: "tell", past: "told", participle: "told", korean: "말해주다", category: "communication", frequency: 8 },
  { base: "feel", past: "felt", participle: "felt", korean: "느끼다", category: "feeling", frequency: 9 },
  { base: "run", past: "ran", participle: "run", korean: "뛰다", category: "movement", frequency: 10 },
];

async function seed() {
  await mongoose.connect(env.MONGODB_URI);
  console.log("Connected to MongoDB for seeding irregular verbs");

  let inserted = 0;
  let updated = 0;
  for (const v of verbs) {
    const res = await IrregularVerb.findOneAndUpdate(
      { base: v.base },
      { $setOnInsert: v },
      { upsert: true, new: false },
    );
    if (res) updated++;
    else inserted++;
  }

  console.log(`Irregular verbs seed complete: ${inserted} inserted, ${updated} already existed (left untouched)`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Irregular verb seed failed:", err);
  process.exit(1);
});
