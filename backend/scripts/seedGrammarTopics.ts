import "dotenv/config";
import mongoose from "mongoose";
import { env } from "../src/config/env";
import { GrammarTopic } from "../src/models/GrammarTopic";

// Additive-only seed: upserts by `title.uz`, never deletes existing data.
// ruleExplanation/usageCases/commonMistakes/examples are left empty here —
// fill them in later via scripts/generateGrammarContent.ts or the admin
// panel's "AI bilan avtomatik yozish" button.
const topics = [
  // Beginner
  {
    title: { uz: "Present Simple", en: "Present Simple", ko: "현재 시제" },
    formula: "S+V",
    level: "beginner",
    order: 1,
  },
  {
    title: { uz: "Present Continuous", en: "Present Continuous", ko: "현재 진행형" },
    formula: "S+be+V-ing",
    level: "beginner",
    order: 2,
  },
  {
    title: { uz: "Ega + Fe'l + To'ldiruvchi", en: "Subject + Verb + Object", ko: "주어 + 동사 + 목적어" },
    formula: "S+V+O",
    level: "beginner",
    order: 3,
  },
  {
    title: {
      uz: "Ega + Bog'lovchi fe'l + Sifat",
      en: "Subject + Linking Verb + Adjective",
      ko: "주어 + 연결동사 + 형용사",
    },
    formula: "S+be+Adj",
    level: "beginner",
    order: 4,
  },
  {
    title: { uz: "There is / There are", en: "There is / There are", ko: "There is / There are" },
    formula: "There+be+O",
    level: "beginner",
    order: 5,
  },
  {
    title: { uz: "Egalik olmoshlari", en: "Possessive Pronouns", ko: "소유격 대명사" },
    formula: "my/your/his/her+Noun",
    level: "beginner",
    order: 6,
  },
  {
    title: { uz: "Ko'plik son (-s)", en: "Plural Nouns (-s)", ko: "복수형 (-s)" },
    formula: "Noun+s",
    level: "beginner",
    order: 7,
  },
  {
    title: { uz: "Ko'rsatish olmoshlari", en: "Demonstrative Pronouns", ko: "지시대명사" },
    formula: "This/That/These/Those+Noun",
    level: "beginner",
    order: 8,
  },
  {
    title: { uz: "Qobiliyat (can)", en: "Ability (can)", ko: "능력 (can)" },
    formula: "S+can+V",
    level: "beginner",
    order: 9,
  },
  {
    title: { uz: "Buyruq gap (Imperative)", en: "Imperative Sentences", ko: "명령문" },
    formula: "V+O",
    level: "beginner",
    order: 10,
  },

  // Intermediate
  {
    title: { uz: "Past Simple", en: "Past Simple", ko: "과거 시제" },
    formula: "S+V2",
    level: "intermediate",
    order: 1,
  },
  {
    title: { uz: "Past Continuous", en: "Past Continuous", ko: "과거 진행형" },
    formula: "S+was/were+V-ing",
    level: "intermediate",
    order: 2,
  },
  {
    title: { uz: "Modal fe'llar (majburiyat)", en: "Modal Verbs (Obligation)", ko: "조동사 (의무)" },
    formula: "S+must/should/have to+V",
    level: "intermediate",
    order: 3,
  },
  {
    title: { uz: "Qiyoslash darajalari", en: "Comparatives", ko: "비교급" },
    formula: "S+be+Adj-er/more Adj+than+O",
    level: "intermediate",
    order: 4,
  },
  {
    title: { uz: "Bog'lovchilar", en: "Conjunctions", ko: "접속사" },
    formula: "S+V+O,+but/because/so+S+V",
    level: "intermediate",
    order: 5,
  },
  {
    title: { uz: "Artikllar", en: "Articles", ko: "관사" },
    formula: "a/an/the+Noun",
    level: "intermediate",
    order: 6,
  },
  {
    title: { uz: "O'rin/vaqt predloglari", en: "Prepositions of Place/Time", ko: "장소/시간 전치사" },
    formula: "S+V+in/on/at+Noun",
    level: "intermediate",
    order: 7,
  },
  {
    title: { uz: "Kelasi zamon (will)", en: "Future Simple (will)", ko: "미래 시제 (will)" },
    formula: "S+will+V",
    level: "intermediate",
    order: 8,
  },
  {
    title: { uz: "Kelasi zamon (be going to)", en: "Future (be going to)", ko: "미래 시제 (be going to)" },
    formula: "S+be+going to+V",
    level: "intermediate",
    order: 9,
  },
  {
    title: { uz: "To'ldiruvchi olmoshlar", en: "Object Pronouns", ko: "목적격 대명사" },
    formula: "S+V+me/him/her/them",
    level: "intermediate",
    order: 10,
  },

  // Advanced
  {
    title: { uz: "Present Perfect", en: "Present Perfect", ko: "현재완료" },
    formula: "S+have/has+V3",
    level: "advanced",
    order: 1,
  },
  {
    title: { uz: "Present Perfect Continuous", en: "Present Perfect Continuous", ko: "현재완료 진행형" },
    formula: "S+have/has+been+V-ing",
    level: "advanced",
    order: 2,
  },
  {
    title: { uz: "Past Perfect", en: "Past Perfect", ko: "과거완료" },
    formula: "S+had+V3",
    level: "advanced",
    order: 3,
  },
  {
    title: { uz: "Majhul nisbat (Passive Voice)", en: "Passive Voice", ko: "수동태" },
    formula: "O+be+V3+by+S",
    level: "advanced",
    order: 4,
  },
  {
    title: { uz: "Shart ergash gap (1-tur)", en: "First Conditional", ko: "1형 조건문" },
    formula: "If+S+V,+S+will+V",
    level: "advanced",
    order: 5,
  },
  {
    title: { uz: "Aniqlovchi ergash gap", en: "Relative Clauses", ko: "관계절" },
    formula: "Noun+who/which/that+V",
    level: "advanced",
    order: 6,
  },
  {
    title: { uz: "Ko'chirma gap (Reported Speech)", en: "Reported Speech", ko: "간접화법" },
    formula: "S+said that+S+V2",
    level: "advanced",
    order: 7,
  },
  {
    title: { uz: "Savol formulasi", en: "Wh- Questions", ko: "의문사 의문문" },
    formula: "Wh-+do/does/did+S+V",
    level: "advanced",
    order: 8,
  },
  {
    title: { uz: "Gerund va Infinitive", en: "Gerund and Infinitive", ko: "동명사와 부정사" },
    formula: "S+V+V-ing/to+V",
    level: "advanced",
    order: 9,
  },
  {
    title: { uz: "Ikki to'ldiruvchili gap", en: "Double Object Sentences", ko: "이중 목적어 문장" },
    formula: "S+V+O+O",
    level: "advanced",
    order: 10,
  },
];

async function seed() {
  await mongoose.connect(env.MONGODB_URI);
  console.log("Connected to MongoDB for seeding grammar topics");

  let inserted = 0;
  let existed = 0;
  for (const topic of topics) {
    const res = await GrammarTopic.findOneAndUpdate(
      { "title.uz": topic.title.uz },
      { $setOnInsert: topic },
      { upsert: true, new: false },
    );
    if (res) existed++;
    else inserted++;
  }

  console.log(`Grammar topics seed complete: ${inserted} inserted, ${existed} already existed (left untouched)`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Grammar topic seed failed:", err);
  process.exit(1);
});
