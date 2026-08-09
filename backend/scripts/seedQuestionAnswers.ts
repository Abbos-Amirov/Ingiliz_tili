import "dotenv/config";
import mongoose from "mongoose";
import { env } from "../src/config/env";
import { Sentence } from "../src/models/Sentence";
import type { GrammarRole } from "../src/config/grammar";

// One-time/occasional seed for FEATURE 1 ("Savol-Javob rejimi") — a starter
// set of beginner-level Yes/No and Wh- question-answer pairs. Idempotent by
// exact-korean-text match on the question side. Admins can add more via
// /admin/questions-answers once this is live.

interface RW {
  text: string;
  role: GrammarRole;
}

interface PairSeed {
  subLevel: 2 | 3;
  questionCategory: "yes_no" | "wh_question";
  question: { korean: string; words: RW[]; formula: string };
  answer: { korean: string; words: RW[]; formula: string };
}

const w = (text: string, role: GrammarRole): RW => ({ text, role });

const PAIRS: PairSeed[] = [
  // ---- Yes/No (subLevel 2) ----
  {
    subLevel: 2,
    questionCategory: "yes_no",
    question: {
      korean: "당신은 차를 좋아하세요?",
      words: [w("Do", "auxiliary"), w("you", "subject"), w("like", "verb"), w("tea", "object")],
      formula: "do+S+V+O",
    },
    answer: {
      korean: "네, 저는 차를 좋아해요.",
      words: [w("I", "subject"), w("like", "verb"), w("tea", "object")],
      formula: "S+V+O",
    },
  },
  {
    subLevel: 2,
    questionCategory: "yes_no",
    question: {
      korean: "당신은 학생인가요?",
      words: [w("Are", "auxiliary"), w("you", "subject"), w("a", "article"), w("student", "object")],
      formula: "be+S+Art+O",
    },
    answer: {
      korean: "네, 저는 학생이에요.",
      words: [w("I", "subject"), w("am", "auxiliary"), w("a", "article"), w("student", "object")],
      formula: "S+be+Art+O",
    },
  },
  {
    subLevel: 2,
    questionCategory: "yes_no",
    question: {
      korean: "그녀는 영어를 말하나요?",
      words: [w("Does", "auxiliary"), w("she", "subject"), w("speak", "verb"), w("English", "object")],
      formula: "does+S+V+O",
    },
    answer: {
      korean: "네, 그녀는 영어를 해요.",
      words: [w("She", "subject"), w("speaks", "verb"), w("English", "object")],
      formula: "S+V+O",
    },
  },
  {
    subLevel: 2,
    questionCategory: "yes_no",
    question: {
      korean: "당신은 수영할 수 있나요?",
      words: [w("Can", "auxiliary"), w("you", "subject"), w("swim", "verb")],
      formula: "can+S+V",
    },
    answer: {
      korean: "네, 저는 수영할 수 있어요.",
      words: [w("I", "subject"), w("can", "auxiliary"), w("swim", "verb")],
      formula: "S+can+V",
    },
  },
  {
    subLevel: 2,
    questionCategory: "yes_no",
    question: {
      korean: "그들은 여기에 사나요?",
      words: [w("Do", "auxiliary"), w("they", "subject"), w("live", "verb"), w("here", "adverb")],
      formula: "do+S+V+Adv",
    },
    answer: {
      korean: "아니요, 그들은 여기에 살지 않아요.",
      words: [w("They", "subject"), w("don't", "auxiliary"), w("live", "verb"), w("here", "adverb")],
      formula: "S+don't+V+Adv",
    },
  },
  {
    subLevel: 2,
    questionCategory: "yes_no",
    question: {
      korean: "그는 당신의 친구인가요?",
      words: [w("Is", "auxiliary"), w("he", "subject"), w("your", "adjective"), w("friend", "object")],
      formula: "be+S+Adj+O",
    },
    answer: {
      korean: "네, 그는 제 친구예요.",
      words: [w("He", "subject"), w("is", "auxiliary"), w("my", "adjective"), w("friend", "object")],
      formula: "S+be+Adj+O",
    },
  },
  {
    subLevel: 2,
    questionCategory: "yes_no",
    question: {
      korean: "당신은 아침을 먹었나요?",
      words: [w("Did", "auxiliary"), w("you", "subject"), w("eat", "verb"), w("breakfast", "object")],
      formula: "did+S+V+O",
    },
    answer: {
      korean: "네, 저는 아침을 먹었어요.",
      words: [w("I", "subject"), w("ate", "verb"), w("breakfast", "object")],
      formula: "S+V+O",
    },
  },
  {
    subLevel: 2,
    questionCategory: "yes_no",
    question: {
      korean: "당신은 차가 있나요?",
      words: [w("Do", "auxiliary"), w("you", "subject"), w("have", "verb"), w("a", "article"), w("car", "object")],
      formula: "do+S+V+Art+O",
    },
    answer: {
      korean: "아니요, 저는 차가 없어요.",
      words: [w("I", "subject"), w("don't", "auxiliary"), w("have", "verb"), w("a", "article"), w("car", "object")],
      formula: "S+don't+V+Art+O",
    },
  },
  // ---- Wh- (subLevel 3) ----
  {
    subLevel: 3,
    questionCategory: "wh_question",
    question: {
      korean: "당신은 어디에 사세요?",
      words: [w("Where", "question_word"), w("do", "auxiliary"), w("you", "subject"), w("live", "verb")],
      formula: "Wh-+do+S+V",
    },
    answer: {
      korean: "저는 서울에 살아요.",
      words: [w("I", "subject"), w("live", "verb"), w("in", "preposition"), w("Seoul", "object")],
      formula: "S+V+Prep+O",
    },
  },
  {
    subLevel: 3,
    questionCategory: "wh_question",
    question: {
      korean: "이름이 뭐예요?",
      words: [w("What", "question_word"), w("is", "auxiliary"), w("your", "adjective"), w("name", "object")],
      formula: "Wh-+be+Adj+O",
    },
    answer: {
      korean: "제 이름은 톰이에요.",
      words: [w("My", "adjective"), w("name", "subject"), w("is", "auxiliary"), w("Tom", "object")],
      formula: "Adj+S+be+O",
    },
  },
  {
    subLevel: 3,
    questionCategory: "wh_question",
    question: {
      korean: "당신은 언제 일어나요?",
      words: [w("When", "question_word"), w("do", "auxiliary"), w("you", "subject"), w("wake", "verb"), w("up", "adverb")],
      formula: "Wh-+do+S+V+Adv",
    },
    answer: {
      korean: "저는 일곱 시에 일어나요.",
      words: [w("I", "subject"), w("wake", "verb"), w("up", "adverb"), w("at", "preposition"), w("seven", "object")],
      formula: "S+V+Adv+Prep+O",
    },
  },
  {
    subLevel: 3,
    questionCategory: "wh_question",
    question: {
      korean: "당신은 왜 행복해요?",
      words: [w("Why", "question_word"), w("are", "auxiliary"), w("you", "subject"), w("happy", "adjective")],
      formula: "Wh-+be+S+Adj",
    },
    answer: {
      korean: "저는 이겨서 행복해요.",
      words: [
        w("I", "subject"),
        w("am", "auxiliary"),
        w("happy", "adjective"),
        w("because", "conjunction"),
        w("I", "subject"),
        w("won", "verb"),
      ],
      formula: "S+be+Adj+because+S+V",
    },
  },
  {
    subLevel: 3,
    questionCategory: "wh_question",
    question: {
      korean: "당신은 학교에 어떻게 가요?",
      words: [w("How", "question_word"), w("do", "auxiliary"), w("you", "subject"), w("go", "verb"), w("to", "preposition"), w("school", "object")],
      formula: "Wh-+do+S+V+Prep+O",
    },
    answer: {
      korean: "저는 버스로 학교에 가요.",
      words: [
        w("I", "subject"),
        w("go", "verb"),
        w("to", "preposition"),
        w("school", "object"),
        w("by", "preposition"),
        w("bus", "object"),
      ],
      formula: "S+V+Prep+O+Prep+O",
    },
  },
  {
    subLevel: 3,
    questionCategory: "wh_question",
    question: {
      korean: "당신의 선생님은 누구예요?",
      words: [w("Who", "question_word"), w("is", "auxiliary"), w("your", "adjective"), w("teacher", "object")],
      formula: "Wh-+be+Adj+O",
    },
    answer: {
      korean: "김 선생님이 제 선생님이에요.",
      words: [w("My", "adjective"), w("teacher", "subject"), w("is", "auxiliary"), w("Kim", "object")],
      formula: "Adj+S+be+O",
    },
  },
  {
    subLevel: 3,
    questionCategory: "wh_question",
    question: {
      korean: "당신은 점심으로 무엇을 먹어요?",
      words: [w("What", "question_word"), w("do", "auxiliary"), w("you", "subject"), w("eat", "verb"), w("for", "preposition"), w("lunch", "object")],
      formula: "Wh-+do+S+V+Prep+O",
    },
    answer: {
      korean: "저는 점심으로 밥을 먹어요.",
      words: [
        w("I", "subject"),
        w("eat", "verb"),
        w("rice", "object"),
        w("for", "preposition"),
        w("lunch", "object"),
      ],
      formula: "S+V+O+Prep+O",
    },
  },
  {
    subLevel: 3,
    questionCategory: "wh_question",
    question: {
      korean: "그녀는 어디에서 일해요?",
      words: [w("Where", "question_word"), w("does", "auxiliary"), w("she", "subject"), w("work", "verb")],
      formula: "Wh-+does+S+V",
    },
    answer: {
      korean: "그녀는 병원에서 일해요.",
      words: [w("She", "subject"), w("works", "verb"), w("at", "preposition"), w("a", "article"), w("hospital", "object")],
      formula: "S+V+Prep+Art+O",
    },
  },
];

async function main() {
  await mongoose.connect(env.MONGODB_URI);
  console.log("Connected to MongoDB for question-answer seeding");

  let created = 0;
  let skipped = 0;
  for (const pair of PAIRS) {
    const existing = await Sentence.findOne({ sentenceType: "question", korean: pair.question.korean });
    if (existing) {
      skipped++;
      continue;
    }
    const savedQuestion = await Sentence.create({
      korean: pair.question.korean,
      words: pair.question.words,
      sentenceType: "question",
      questionCategory: pair.questionCategory,
      formula: pair.question.formula,
      level: "beginner",
      subLevel: pair.subLevel,
    });
    const savedAnswer = await Sentence.create({
      korean: pair.answer.korean,
      words: pair.answer.words,
      sentenceType: "answer",
      formula: pair.answer.formula,
      level: "beginner",
      subLevel: pair.subLevel,
      pairId: savedQuestion._id,
    });
    savedQuestion.pairId = savedAnswer._id;
    await savedQuestion.save();
    created++;
  }

  console.log(`Seeded ${created} new question-answer pairs (${skipped} already existed).`);
  console.log("Done.");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Question-answer seeding failed:", err);
  process.exit(1);
});
