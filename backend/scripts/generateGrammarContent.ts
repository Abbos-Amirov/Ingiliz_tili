import "dotenv/config";
import mongoose from "mongoose";
import { env } from "../src/config/env";
import { GrammarTopic } from "../src/models/GrammarTopic";
import { Sentence } from "../src/models/Sentence";
import { generateGrammarTopicContent, suggestSentenceRoles } from "../src/services/ai.service";

// A fixed, out-of-band lesson range for auto-generated grammar practice
// sentences — never mixed into the real curriculum (see isGrammarPractice
// filtering in sentences.controller.ts / lessons.controller.ts).
const GRAMMAR_LESSON_NUMBER = 9999;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fillTopicContent(topic: InstanceType<typeof GrammarTopic>) {
  if (topic.ruleExplanation?.uz) {
    console.log(`  content already present, skipping AI-generate`);
    return topic;
  }
  console.log(`  generating rule/usage/mistakes/examples via AI...`);
  const suggestion = await generateGrammarTopicContent(topic.title!.uz, topic.formula, topic.level);
  const updated = await GrammarTopic.findByIdAndUpdate(
    topic._id,
    {
      ruleExplanation: suggestion.ruleExplanation,
      usageCases: suggestion.usageCases,
      commonMistakes: suggestion.commonMistakes,
      examples: suggestion.examples,
    },
    { new: true },
  );
  console.log(`  content saved (${suggestion.examples.length} examples)`);
  return updated!;
}

async function createPracticeSentences(topic: InstanceType<typeof GrammarTopic>) {
  let created = 0;
  let skipped = 0;
  for (const ex of topic.examples) {
    const existing = await Sentence.findOne({ korean: ex.korean, isGrammarPractice: true });
    if (existing) {
      skipped++;
      continue;
    }
    try {
      const roles = await suggestSentenceRoles(ex.english, ex.korean);
      await Sentence.create({
        korean: ex.korean,
        words: roles.words,
        distractorWords: roles.distractorWords,
        // Use the topic's own canonical formula (not the AI's guess) so the
        // exact-match `formula` filter used by the Grammar Hub always finds it.
        formula: topic.formula,
        level: topic.level,
        lessonNumber: GRAMMAR_LESSON_NUMBER,
        lessonNumberEnd: GRAMMAR_LESSON_NUMBER,
        isGrammarPractice: true,
      });
      created++;
    } catch (err) {
      console.error(`  failed to create sentence for "${ex.english}":`, (err as Error).message);
    }
    await sleep(200);
  }
  console.log(`  practice sentences: ${created} created, ${skipped} already existed`);
}

async function main() {
  await mongoose.connect(env.MONGODB_URI);
  console.log("Connected to MongoDB for grammar content generation");

  const topics = await GrammarTopic.find().sort({ level: 1, order: 1 });
  console.log(`Found ${topics.length} grammar topics`);

  for (const topic of topics) {
    console.log(`\n[${topic.level}] ${topic.title!.uz} (${topic.formula})`);
    const filled = await fillTopicContent(topic);
    await sleep(200);
    await createPracticeSentences(filled);
  }

  console.log("\nDone.");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Grammar content generation failed:", err);
  process.exit(1);
});
