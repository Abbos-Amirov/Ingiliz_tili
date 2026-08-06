import "dotenv/config";
import mongoose from "mongoose";
import { env } from "../src/config/env";

// Old (string) title -> new trilingual title. Keyed by the exact Uzbek text
// every existing GrammarTopic document currently has in its `title` field.
// Uses the raw driver (bypasses Mongoose schema casting) so this can run
// safely BEFORE the GrammarTopic model's `title` field is changed to an object.
const TITLE_MAP: Record<string, { uz: string; en: string; ko: string }> = {
  "Present Simple": { uz: "Present Simple", en: "Present Simple", ko: "현재 시제" },
  "Present Continuous": { uz: "Present Continuous", en: "Present Continuous", ko: "현재 진행형" },
  "Ega + Fe'l + To'ldiruvchi": { uz: "Ega + Fe'l + To'ldiruvchi", en: "Subject + Verb + Object", ko: "주어 + 동사 + 목적어" },
  "Ega + Bog'lovchi fe'l + Sifat": {
    uz: "Ega + Bog'lovchi fe'l + Sifat",
    en: "Subject + Linking Verb + Adjective",
    ko: "주어 + 연결동사 + 형용사",
  },
  "There is / There are": { uz: "There is / There are", en: "There is / There are", ko: "There is / There are" },
  "Egalik olmoshlari": { uz: "Egalik olmoshlari", en: "Possessive Pronouns", ko: "소유격 대명사" },
  "Ko'plik son (-s)": { uz: "Ko'plik son (-s)", en: "Plural Nouns (-s)", ko: "복수형 (-s)" },
  "Ko'rsatish olmoshlari": { uz: "Ko'rsatish olmoshlari", en: "Demonstrative Pronouns", ko: "지시대명사" },
  "Qobiliyat (can)": { uz: "Qobiliyat (can)", en: "Ability (can)", ko: "능력 (can)" },
  "Buyruq gap (Imperative)": { uz: "Buyruq gap (Imperative)", en: "Imperative Sentences", ko: "명령문" },

  "Past Simple": { uz: "Past Simple", en: "Past Simple", ko: "과거 시제" },
  "Past Continuous": { uz: "Past Continuous", en: "Past Continuous", ko: "과거 진행형" },
  "Modal fe'llar (majburiyat)": { uz: "Modal fe'llar (majburiyat)", en: "Modal Verbs (Obligation)", ko: "조동사 (의무)" },
  "Qiyoslash darajalari": { uz: "Qiyoslash darajalari", en: "Comparatives", ko: "비교급" },
  "Bog'lovchilar": { uz: "Bog'lovchilar", en: "Conjunctions", ko: "접속사" },
  "Artikllar": { uz: "Artikllar", en: "Articles", ko: "관사" },
  "O'rin/vaqt predloglari": { uz: "O'rin/vaqt predloglari", en: "Prepositions of Place/Time", ko: "장소/시간 전치사" },
  "Kelasi zamon (will)": { uz: "Kelasi zamon (will)", en: "Future Simple (will)", ko: "미래 시제 (will)" },
  "Kelasi zamon (be going to)": {
    uz: "Kelasi zamon (be going to)",
    en: "Future (be going to)",
    ko: "미래 시제 (be going to)",
  },
  "To'ldiruvchi olmoshlar": { uz: "To'ldiruvchi olmoshlar", en: "Object Pronouns", ko: "목적격 대명사" },

  "Present Perfect": { uz: "Present Perfect", en: "Present Perfect", ko: "현재완료" },
  "Present Perfect Continuous": {
    uz: "Present Perfect Continuous",
    en: "Present Perfect Continuous",
    ko: "현재완료 진행형",
  },
  "Past Perfect": { uz: "Past Perfect", en: "Past Perfect", ko: "과거완료" },
  "Majhul nisbat (Passive Voice)": { uz: "Majhul nisbat (Passive Voice)", en: "Passive Voice", ko: "수동태" },
  "Shart ergash gap (1-tur)": { uz: "Shart ergash gap (1-tur)", en: "First Conditional", ko: "1형 조건문" },
  "Aniqlovchi ergash gap": { uz: "Aniqlovchi ergash gap", en: "Relative Clauses", ko: "관계절" },
  "Ko'chirma gap (Reported Speech)": { uz: "Ko'chirma gap (Reported Speech)", en: "Reported Speech", ko: "간접화법" },
  "Savol formulasi": { uz: "Savol formulasi", en: "Wh- Questions", ko: "의문사 의문문" },
  "Gerund va Infinitive": { uz: "Gerund va Infinitive", en: "Gerund and Infinitive", ko: "동명사와 부정사" },
  "Ikki to'ldiruvchili gap": { uz: "Ikki to'ldiruvchili gap", en: "Double Object Sentences", ko: "이중 목적어 문장" },
};

async function main() {
  await mongoose.connect(env.MONGODB_URI);
  console.log("Connected to MongoDB for grammar title migration");

  const collection = mongoose.connection.collection("grammartopics");
  const docs = await collection.find({}).toArray();
  console.log(`Found ${docs.length} grammar topic documents`);

  let migrated = 0;
  let skipped = 0;
  let unmapped = 0;

  for (const doc of docs) {
    if (doc.title && typeof doc.title === "object") {
      skipped++;
      continue;
    }
    const mapped = TITLE_MAP[doc.title as string];
    if (!mapped) {
      console.warn(`  no mapping found for title "${doc.title}" (_id: ${doc._id}) — left untouched`);
      unmapped++;
      continue;
    }
    await collection.updateOne({ _id: doc._id }, { $set: { title: mapped } });
    migrated++;
  }

  console.log(`Migration complete: ${migrated} migrated, ${skipped} already migrated, ${unmapped} unmapped`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Grammar title migration failed:", err);
  process.exit(1);
});
