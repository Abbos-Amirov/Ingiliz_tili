import "dotenv/config";
import mongoose from "mongoose";
import { env } from "../src/config/env";
import { Word } from "../src/models/Word";
import { Sentence } from "../src/models/Sentence";
import { User } from "../src/models/User";
import { hashPassword } from "../src/utils/password";

const words = [
  // Lesson 1 — motion verbs
  { english: "go", korean: "가다", exampleSentenceEn: "I go to school.", exampleSentenceKo: "나는 학교에 간다.", category: "motion-verbs", difficulty: "beginner", partOfSpeech: "verb", lessonNumber: 1 },
  { english: "come", korean: "오다", exampleSentenceEn: "Please come here.", exampleSentenceKo: "여기로 오세요.", category: "motion-verbs", difficulty: "beginner", partOfSpeech: "verb", lessonNumber: 1 },
  { english: "run", korean: "뛰다", exampleSentenceEn: "She runs every morning.", exampleSentenceKo: "그녀는 매일 아침 뛴다.", category: "motion-verbs", difficulty: "beginner", partOfSpeech: "verb", lessonNumber: 1 },
  { english: "walk", korean: "걷다", exampleSentenceEn: "We walk to the park.", exampleSentenceKo: "우리는 공원까지 걷는다.", category: "motion-verbs", difficulty: "beginner", partOfSpeech: "verb", lessonNumber: 1 },
  { english: "jump", korean: "뛰어오르다", exampleSentenceEn: "The cat jumps high.", exampleSentenceKo: "고양이가 높이 뛴다.", category: "motion-verbs", difficulty: "intermediate", partOfSpeech: "verb", lessonNumber: 1 },
  { english: "drive", korean: "운전하다", exampleSentenceEn: "He drives a car.", exampleSentenceKo: "그는 차를 운전한다.", category: "motion-verbs", difficulty: "intermediate", partOfSpeech: "verb", lessonNumber: 1 },
  // Lesson 2 — food
  { english: "eat", korean: "먹다", exampleSentenceEn: "I eat breakfast at 7.", exampleSentenceKo: "나는 7시에 아침을 먹는다.", category: "food", difficulty: "beginner", partOfSpeech: "verb", lessonNumber: 2 },
  { english: "drink", korean: "마시다", exampleSentenceEn: "She drinks coffee.", exampleSentenceKo: "그녀는 커피를 마신다.", category: "food", difficulty: "beginner", partOfSpeech: "verb", lessonNumber: 2 },
  { english: "water", korean: "물", exampleSentenceEn: "Give me some water.", exampleSentenceKo: "물 좀 주세요.", category: "food", difficulty: "beginner", partOfSpeech: "noun", lessonNumber: 2 },
  { english: "bread", korean: "빵", exampleSentenceEn: "I like fresh bread.", exampleSentenceKo: "나는 신선한 빵을 좋아한다.", category: "food", difficulty: "beginner", partOfSpeech: "noun", lessonNumber: 2 },
  { english: "apple", korean: "사과", exampleSentenceEn: "An apple a day.", exampleSentenceKo: "하루에 사과 하나.", category: "food", difficulty: "beginner", partOfSpeech: "noun", lessonNumber: 2 },
  { english: "rice", korean: "밥", exampleSentenceEn: "We eat rice every day.", exampleSentenceKo: "우리는 매일 밥을 먹는다.", category: "food", difficulty: "beginner", partOfSpeech: "noun", lessonNumber: 2 },
  // Lesson 3 — daily life
  { english: "sleep", korean: "자다", exampleSentenceEn: "I sleep at ten.", exampleSentenceKo: "나는 10시에 잔다.", category: "daily-life", difficulty: "beginner", partOfSpeech: "verb", lessonNumber: 3 },
  { english: "work", korean: "일하다", exampleSentenceEn: "He works hard.", exampleSentenceKo: "그는 열심히 일한다.", category: "daily-life", difficulty: "beginner", partOfSpeech: "verb", lessonNumber: 3 },
  { english: "study", korean: "공부하다", exampleSentenceEn: "They study English.", exampleSentenceKo: "그들은 영어를 공부한다.", category: "daily-life", difficulty: "beginner", partOfSpeech: "verb", lessonNumber: 3 },
  { english: "home", korean: "집", exampleSentenceEn: "I am going home.", exampleSentenceKo: "나는 집에 가고 있다.", category: "daily-life", difficulty: "beginner", partOfSpeech: "noun", lessonNumber: 3 },
  { english: "wake up", korean: "일어나다", exampleSentenceEn: "I wake up early.", exampleSentenceKo: "나는 일찍 일어난다.", category: "daily-life", difficulty: "intermediate", partOfSpeech: "verb", lessonNumber: 3 },
  // Lesson 4 — people & objects
  { english: "friend", korean: "친구", exampleSentenceEn: "She is my friend.", exampleSentenceKo: "그녀는 내 친구다.", category: "people", difficulty: "beginner", partOfSpeech: "noun", lessonNumber: 4 },
  { english: "family", korean: "가족", exampleSentenceEn: "I love my family.", exampleSentenceKo: "나는 우리 가족을 사랑한다.", category: "people", difficulty: "beginner", partOfSpeech: "noun", lessonNumber: 4 },
  { english: "teacher", korean: "선생님", exampleSentenceEn: "The teacher is kind.", exampleSentenceKo: "선생님은 친절하다.", category: "people", difficulty: "beginner", partOfSpeech: "noun", lessonNumber: 4 },
  { english: "student", korean: "학생", exampleSentenceEn: "He is a good student.", exampleSentenceKo: "그는 좋은 학생이다.", category: "people", difficulty: "beginner", partOfSpeech: "noun", lessonNumber: 4 },
  { english: "book", korean: "책", exampleSentenceEn: "I read a book.", exampleSentenceKo: "나는 책을 읽는다.", category: "objects", difficulty: "beginner", partOfSpeech: "noun", lessonNumber: 4 },
  { english: "phone", korean: "전화기", exampleSentenceEn: "My phone is new.", exampleSentenceKo: "내 전화기는 새것이다.", category: "objects", difficulty: "beginner", partOfSpeech: "noun", lessonNumber: 4 },
  { english: "car", korean: "자동차", exampleSentenceEn: "The car is fast.", exampleSentenceKo: "그 자동차는 빠르다.", category: "objects", difficulty: "beginner", partOfSpeech: "noun", lessonNumber: 4 },
  { english: "door", korean: "문", exampleSentenceEn: "Close the door, please.", exampleSentenceKo: "문 좀 닫아 주세요.", category: "objects", difficulty: "beginner", partOfSpeech: "noun", lessonNumber: 4 },
  // Lesson 5 — adjectives
  { english: "happy", korean: "행복한", exampleSentenceEn: "I feel happy today.", exampleSentenceKo: "나는 오늘 행복하다.", category: "adjectives", difficulty: "beginner", partOfSpeech: "adjective", lessonNumber: 5 },
  { english: "big", korean: "큰", exampleSentenceEn: "That is a big house.", exampleSentenceKo: "저것은 큰 집이다.", category: "adjectives", difficulty: "beginner", partOfSpeech: "adjective", lessonNumber: 5 },
  { english: "fast", korean: "빠른", exampleSentenceEn: "He is a fast runner.", exampleSentenceKo: "그는 빠른 달리기 선수다.", category: "adjectives", difficulty: "intermediate", partOfSpeech: "adjective", lessonNumber: 5 },
  // Lessons 6-7 — combined teaching day, demonstrates a lesson range
  { english: "listen", korean: "듣다", exampleSentenceEn: "I listen to music.", exampleSentenceKo: "나는 음악을 듣는다.", category: "motion-verbs", difficulty: "beginner", partOfSpeech: "verb", lessonNumber: 6, lessonNumberEnd: 7 },
  { english: "write", korean: "쓰다", exampleSentenceEn: "She writes a letter.", exampleSentenceKo: "그녀는 편지를 쓴다.", category: "daily-life", difficulty: "beginner", partOfSpeech: "verb", lessonNumber: 6, lessonNumberEnd: 7 },
];

function w(text: string, role: string) {
  return { text, role };
}

const sentences = [
  {
    korean: "그녀는 매일 아침 뛴다.",
    words: [w("She", "subject"), w("runs", "verb"), w("every", "adjective"), w("morning", "object")],
    distractorWords: [w("run", "verb")],
    formula: "S+V+O",
    level: "beginner",
    lessonNumber: 1,
  },
  {
    korean: "우리는 공원까지 걷는다.",
    words: [w("We", "subject"), w("walk", "verb"), w("to", "preposition"), w("the", "article"), w("park", "object")],
    distractorWords: [w("walks", "verb")],
    formula: "S+V+O",
    level: "intermediate",
    lessonNumber: 1,
  },
  {
    korean: "나는 아침을 먹는다.",
    words: [w("I", "subject"), w("eat", "verb"), w("breakfast", "object")],
    distractorWords: [w("eats", "verb"), w("ate", "verb")],
    formula: "S+V+O",
    level: "beginner",
    lessonNumber: 2,
  },
  {
    korean: "그녀는 커피 마시는 것을 좋아한다.",
    words: [w("She", "subject"), w("likes", "verb"), w("drinking", "verb"), w("coffee", "object")],
    distractorWords: [w("drink", "verb"), w("drinks", "verb")],
    formula: "S+V+V-ing+O",
    level: "intermediate",
    lessonNumber: 2,
  },
  {
    korean: "나는 집에 가고 있다.",
    words: [w("I", "subject"), w("am", "auxiliary"), w("going", "verb"), w("home", "object")],
    distractorWords: [w("goes", "verb")],
    formula: "S+be+V-ing+O",
    level: "beginner",
    lessonNumber: 3,
  },
  {
    korean: "그는 열심히 일한다.",
    words: [w("He", "subject"), w("works", "verb"), w("hard", "adverb")],
    distractorWords: [w("work", "verb"), w("working", "verb")],
    formula: "S+V+Adv",
    level: "beginner",
    lessonNumber: 3,
  },
  {
    korean: "그들은 영어를 공부하고 있다.",
    words: [w("They", "subject"), w("are", "auxiliary"), w("studying", "verb"), w("English", "object")],
    distractorWords: [w("study", "verb"), w("studies", "verb")],
    formula: "S+be+V-ing+O",
    level: "intermediate",
    lessonNumber: 3,
  },
  {
    korean: "나는 일찍 일어나서 학교에 간다.",
    words: [
      w("I", "subject"),
      w("wake", "verb"),
      w("up", "adverb"),
      w("early", "adverb"),
      w("and", "conjunction"),
      w("go", "verb"),
      w("to", "preposition"),
      w("school", "object"),
    ],
    distractorWords: [w("woke", "verb"), w("goes", "verb")],
    formula: "S+V+Adv+and+S+V+O",
    level: "advanced",
    lessonNumber: 3,
  },
  {
    korean: "나는 어제 친구를 만났다.",
    words: [w("I", "subject"), w("met", "verb"), w("my", "pronoun"), w("friend", "object"), w("yesterday", "adverb")],
    distractorWords: [w("meet", "verb"), w("meeting", "verb")],
    formula: "S+V+O+Adv",
    level: "intermediate",
    lessonNumber: 4,
  },
  {
    korean: "나는 그 책을 읽었지만 이해하지 못했다.",
    words: [
      w("I", "subject"),
      w("read", "verb"),
      w("the", "article"),
      w("book", "object"),
      w("but", "conjunction"),
      w("didn't", "auxiliary"),
      w("understand", "verb"),
      w("it", "pronoun"),
    ],
    distractorWords: [w("reads", "verb"), w("understood", "verb")],
    formula: "S+V+O+but+S+didn't+V+O",
    level: "advanced",
    lessonNumber: 4,
  },
  {
    korean: "만약 비가 오면 우리는 집에 있을 것이다.",
    words: [
      w("If", "conjunction"),
      w("it", "pronoun"),
      w("rains", "verb"),
      w("we", "subject"),
      w("will", "auxiliary"),
      w("stay", "verb"),
      w("home", "object"),
    ],
    distractorWords: [w("rained", "verb"), w("stayed", "verb")],
    formula: "If+S+V,+S+will+V+O",
    level: "advanced",
    lessonNumber: 5,
  },
  {
    korean: "그 차는 크고 빠르다.",
    words: [w("The", "article"), w("car", "subject"), w("is", "auxiliary"), w("big", "adjective"), w("and", "conjunction"), w("fast", "adjective")],
    distractorWords: [w("was", "auxiliary"), w("faster", "adjective")],
    formula: "S+be+Adj+and+Adj",
    level: "intermediate",
    lessonNumber: 5,
  },
];

async function seed() {
  await mongoose.connect(env.MONGODB_URI);
  console.log("Connected to MongoDB for seeding");

  await Word.deleteMany({});
  await Sentence.deleteMany({});
  // lessonNumberEnd defaults to lessonNumber for entries that don't set it explicitly.
  const wordsWithRange = words.map((word) => ({ lessonNumberEnd: word.lessonNumber, ...word }));
  const sentencesWithRange = sentences.map((s) => ({ lessonNumberEnd: s.lessonNumber, ...s }));
  await Word.insertMany(wordsWithRange);
  await Sentence.insertMany(sentencesWithRange);
  console.log(`Seeded ${words.length} words and ${sentences.length} sentences across lessons 1-7`);

  const adminEmail = "admin@ingiliztili.local";
  const existingAdmin = await User.findOne({ email: adminEmail });
  if (!existingAdmin) {
    const passwordHash = await hashPassword("Admin123!");
    await User.create({
      email: adminEmail,
      passwordHash,
      role: "admin",
      displayName: "Admin",
    });
    console.log(`Seeded admin user: ${adminEmail} / Admin123!  (change this password after first login)`);
  } else {
    console.log("Admin user already exists, skipping");
  }

  await mongoose.disconnect();
  console.log("Seeding complete");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
