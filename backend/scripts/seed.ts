import "dotenv/config";
import mongoose from "mongoose";
import { env } from "../src/config/env";
import { Word } from "../src/models/Word";
import { Sentence } from "../src/models/Sentence";
import { User } from "../src/models/User";
import { hashPassword } from "../src/utils/password";

const words = [
  // Lesson 1 — motion verbs
  { english: "go", korean: "가다", exampleSentenceEn: "I go to school.", exampleSentenceKo: "나는 학교에 간다.", category: "motion-verbs", difficulty: "beginner", lessonNumber: 1 },
  { english: "come", korean: "오다", exampleSentenceEn: "Please come here.", exampleSentenceKo: "여기로 오세요.", category: "motion-verbs", difficulty: "beginner", lessonNumber: 1 },
  { english: "run", korean: "뛰다", exampleSentenceEn: "She runs every morning.", exampleSentenceKo: "그녀는 매일 아침 뛴다.", category: "motion-verbs", difficulty: "beginner", lessonNumber: 1 },
  { english: "walk", korean: "걷다", exampleSentenceEn: "We walk to the park.", exampleSentenceKo: "우리는 공원까지 걷는다.", category: "motion-verbs", difficulty: "beginner", lessonNumber: 1 },
  { english: "jump", korean: "뛰어오르다", exampleSentenceEn: "The cat jumps high.", exampleSentenceKo: "고양이가 높이 뛴다.", category: "motion-verbs", difficulty: "intermediate", lessonNumber: 1 },
  { english: "drive", korean: "운전하다", exampleSentenceEn: "He drives a car.", exampleSentenceKo: "그는 차를 운전한다.", category: "motion-verbs", difficulty: "intermediate", lessonNumber: 1 },
  // Lesson 2 — food
  { english: "eat", korean: "먹다", exampleSentenceEn: "I eat breakfast at 7.", exampleSentenceKo: "나는 7시에 아침을 먹는다.", category: "food", difficulty: "beginner", lessonNumber: 2 },
  { english: "drink", korean: "마시다", exampleSentenceEn: "She drinks coffee.", exampleSentenceKo: "그녀는 커피를 마신다.", category: "food", difficulty: "beginner", lessonNumber: 2 },
  { english: "water", korean: "물", exampleSentenceEn: "Give me some water.", exampleSentenceKo: "물 좀 주세요.", category: "food", difficulty: "beginner", lessonNumber: 2 },
  { english: "bread", korean: "빵", exampleSentenceEn: "I like fresh bread.", exampleSentenceKo: "나는 신선한 빵을 좋아한다.", category: "food", difficulty: "beginner", lessonNumber: 2 },
  { english: "apple", korean: "사과", exampleSentenceEn: "An apple a day.", exampleSentenceKo: "하루에 사과 하나.", category: "food", difficulty: "beginner", lessonNumber: 2 },
  { english: "rice", korean: "밥", exampleSentenceEn: "We eat rice every day.", exampleSentenceKo: "우리는 매일 밥을 먹는다.", category: "food", difficulty: "beginner", lessonNumber: 2 },
  // Lesson 3 — daily life
  { english: "sleep", korean: "자다", exampleSentenceEn: "I sleep at ten.", exampleSentenceKo: "나는 10시에 잔다.", category: "daily-life", difficulty: "beginner", lessonNumber: 3 },
  { english: "work", korean: "일하다", exampleSentenceEn: "He works hard.", exampleSentenceKo: "그는 열심히 일한다.", category: "daily-life", difficulty: "beginner", lessonNumber: 3 },
  { english: "study", korean: "공부하다", exampleSentenceEn: "They study English.", exampleSentenceKo: "그들은 영어를 공부한다.", category: "daily-life", difficulty: "beginner", lessonNumber: 3 },
  { english: "home", korean: "집", exampleSentenceEn: "I am going home.", exampleSentenceKo: "나는 집에 가고 있다.", category: "daily-life", difficulty: "beginner", lessonNumber: 3 },
  { english: "wake up", korean: "일어나다", exampleSentenceEn: "I wake up early.", exampleSentenceKo: "나는 일찍 일어난다.", category: "daily-life", difficulty: "intermediate", lessonNumber: 3 },
  // Lesson 4 — people & objects
  { english: "friend", korean: "친구", exampleSentenceEn: "She is my friend.", exampleSentenceKo: "그녀는 내 친구다.", category: "people", difficulty: "beginner", lessonNumber: 4 },
  { english: "family", korean: "가족", exampleSentenceEn: "I love my family.", exampleSentenceKo: "나는 우리 가족을 사랑한다.", category: "people", difficulty: "beginner", lessonNumber: 4 },
  { english: "teacher", korean: "선생님", exampleSentenceEn: "The teacher is kind.", exampleSentenceKo: "선생님은 친절하다.", category: "people", difficulty: "beginner", lessonNumber: 4 },
  { english: "student", korean: "학생", exampleSentenceEn: "He is a good student.", exampleSentenceKo: "그는 좋은 학생이다.", category: "people", difficulty: "beginner", lessonNumber: 4 },
  { english: "book", korean: "책", exampleSentenceEn: "I read a book.", exampleSentenceKo: "나는 책을 읽는다.", category: "objects", difficulty: "beginner", lessonNumber: 4 },
  { english: "phone", korean: "전화기", exampleSentenceEn: "My phone is new.", exampleSentenceKo: "내 전화기는 새것이다.", category: "objects", difficulty: "beginner", lessonNumber: 4 },
  { english: "car", korean: "자동차", exampleSentenceEn: "The car is fast.", exampleSentenceKo: "그 자동차는 빠르다.", category: "objects", difficulty: "beginner", lessonNumber: 4 },
  { english: "door", korean: "문", exampleSentenceEn: "Close the door, please.", exampleSentenceKo: "문 좀 닫아 주세요.", category: "objects", difficulty: "beginner", lessonNumber: 4 },
  // Lesson 5 — adjectives
  { english: "happy", korean: "행복한", exampleSentenceEn: "I feel happy today.", exampleSentenceKo: "나는 오늘 행복하다.", category: "adjectives", difficulty: "beginner", lessonNumber: 5 },
  { english: "big", korean: "큰", exampleSentenceEn: "That is a big house.", exampleSentenceKo: "저것은 큰 집이다.", category: "adjectives", difficulty: "beginner", lessonNumber: 5 },
  { english: "fast", korean: "빠른", exampleSentenceEn: "He is a fast runner.", exampleSentenceKo: "그는 빠른 달리기 선수다.", category: "adjectives", difficulty: "intermediate", lessonNumber: 5 },
];

const sentences = [
  { korean: "그녀는 매일 아침 뛴다.", englishWords: ["She", "runs", "every", "morning"], distractorWords: ["run"], level: "beginner", lessonNumber: 1 },
  { korean: "우리는 공원까지 걷는다.", englishWords: ["We", "walk", "to", "the", "park"], distractorWords: ["walks"], level: "intermediate", lessonNumber: 1 },
  { korean: "나는 아침을 먹는다.", englishWords: ["I", "eat", "breakfast"], distractorWords: ["eats", "ate"], level: "beginner", lessonNumber: 2 },
  { korean: "그녀는 커피 마시는 것을 좋아한다.", englishWords: ["She", "likes", "drinking", "coffee"], distractorWords: ["drink", "drinks"], level: "intermediate", lessonNumber: 2 },
  { korean: "나는 집에 가고 있다.", englishWords: ["I", "am", "going", "home"], distractorWords: ["goes"], level: "beginner", lessonNumber: 3 },
  { korean: "그는 열심히 일한다.", englishWords: ["He", "works", "hard"], distractorWords: ["work", "working"], level: "beginner", lessonNumber: 3 },
  { korean: "그들은 영어를 공부하고 있다.", englishWords: ["They", "are", "studying", "English"], distractorWords: ["study", "studies"], level: "intermediate", lessonNumber: 3 },
  { korean: "나는 일찍 일어나서 학교에 간다.", englishWords: ["I", "wake", "up", "early", "and", "go", "to", "school"], distractorWords: ["woke", "goes"], level: "advanced", lessonNumber: 3 },
  { korean: "나는 어제 친구를 만났다.", englishWords: ["I", "met", "my", "friend", "yesterday"], distractorWords: ["meet", "meeting"], level: "intermediate", lessonNumber: 4 },
  { korean: "나는 그 책을 읽었지만 이해하지 못했다.", englishWords: ["I", "read", "the", "book", "but", "didn't", "understand", "it"], distractorWords: ["reads", "understood"], level: "advanced", lessonNumber: 4 },
  { korean: "만약 비가 오면 우리는 집에 있을 것이다.", englishWords: ["If", "it", "rains", "we", "will", "stay", "home"], distractorWords: ["rained", "stayed"], level: "advanced", lessonNumber: 5 },
  { korean: "그 차는 크고 빠르다.", englishWords: ["The", "car", "is", "big", "and", "fast"], distractorWords: ["was", "faster"], level: "intermediate", lessonNumber: 5 },
];

async function seed() {
  await mongoose.connect(env.MONGODB_URI);
  console.log("Connected to MongoDB for seeding");

  await Word.deleteMany({});
  await Sentence.deleteMany({});
  await Word.insertMany(words);
  await Sentence.insertMany(sentences);
  console.log(`Seeded ${words.length} words and ${sentences.length} sentences across 5 lessons`);

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
