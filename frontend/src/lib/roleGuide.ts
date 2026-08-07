import type { GrammarRole } from "./types";

interface RoleExampleSentence {
  english: string;
  korean: string;
  uzbek: string;
}

interface RoleGuideEntry {
  examples: string[];
  sentences: RoleExampleSentence[];
}

// Example filler-words and demo sentences for each grammar role, shown in
// RoleInfoModal when a learner taps a formula token (S, V, O, Adj, ...).
// These are the same regardless of UI language — only the description text
// (in translations.ts under "roleGuide") switches with the locale switcher.
export const ROLE_GUIDE_EXAMPLES: Record<GrammarRole, RoleGuideEntry> = {
  subject: {
    examples: ["I", "You", "He", "She", "It", "We", "They", "The teacher", "My friend"],
    sentences: [
      { english: "I read a book.", korean: "나는 책을 읽는다.", uzbek: "Men kitob o'qiyman." },
      { english: "She works hard.", korean: "그녀는 열심히 일한다.", uzbek: "U qattiq ishlaydi." },
    ],
  },
  verb: {
    examples: ["go", "eat", "run", "is", "have", "write", "play"],
    sentences: [
      { english: "I go to school.", korean: "나는 학교에 간다.", uzbek: "Men maktabga boraman." },
      { english: "They eat breakfast.", korean: "그들은 아침을 먹는다.", uzbek: "Ular nonushta qiladi." },
    ],
  },
  auxiliary: {
    examples: ["am", "is", "are", "was", "were", "will", "have", "has", "can", "must", "should"],
    sentences: [
      { english: "I am reading.", korean: "나는 읽고 있다.", uzbek: "Men o'qiyapman." },
      { english: "She will come tomorrow.", korean: "그녀는 내일 올 것이다.", uzbek: "U ertaga keladi." },
    ],
  },
  object: {
    examples: ["a book", "the letter", "him", "her", "the ball", "some water"],
    sentences: [
      { english: "I read a book.", korean: "나는 책을 읽는다.", uzbek: "Men kitob o'qiyman." },
      { english: "She wrote a letter.", korean: "그녀는 편지를 썼다.", uzbek: "U xat yozdi." },
    ],
  },
  adjective: {
    examples: ["big", "happy", "beautiful", "fast", "smart", "small"],
    sentences: [
      { english: "She is happy.", korean: "그녀는 행복하다.", uzbek: "U baxtli." },
      { english: "That is a big house.", korean: "저것은 큰 집이다.", uzbek: "U katta uy." },
    ],
  },
  adverb: {
    examples: ["quickly", "always", "here", "very", "yesterday", "slowly"],
    sentences: [
      { english: "He runs quickly.", korean: "그는 빠르게 뛴다.", uzbek: "U tez yuguradi." },
      { english: "I always wake up early.", korean: "나는 항상 일찍 일어난다.", uzbek: "Men doim erta uyg'onaman." },
    ],
  },
  preposition: {
    examples: ["in", "on", "at", "to", "from", "with"],
    sentences: [
      { english: "The book is on the table.", korean: "책이 탁자 위에 있다.", uzbek: "Kitob stol ustida." },
      { english: "We meet at 7 PM.", korean: "우리는 저녁 7시에 만난다.", uzbek: "Biz kechqurun soat 7 da uchrashamiz." },
    ],
  },
  conjunction: {
    examples: ["and", "but", "because", "so", "if"],
    sentences: [
      { english: "I like tea and coffee.", korean: "나는 차와 커피를 좋아한다.", uzbek: "Men choy va kofeni yaxshi ko'raman." },
      {
        english: "I stayed home because it rained.",
        korean: "비가 와서 나는 집에 있었다.",
        uzbek: "Yomg'ir yog'gani uchun uyda qoldim.",
      },
    ],
  },
  article: {
    examples: ["a", "an", "the"],
    sentences: [
      { english: "I saw a cat.", korean: "나는 고양이를 보았다.", uzbek: "Men mushuk ko'rdim." },
      { english: "The cat was black.", korean: "그 고양이는 검은색이었다.", uzbek: "Mushuk qora edi." },
    ],
  },
  pronoun: {
    examples: ["I", "you", "he", "she", "it", "we", "they", "this", "that"],
    sentences: [
      { english: "Tom is my friend. He is kind.", korean: "톰은 내 친구다. 그는 친절하다.", uzbek: "Tom mening do'stim. U mehribon." },
    ],
  },
  interjection: {
    examples: ["Wow", "Oh", "Great", "Ouch", "Hey"],
    sentences: [{ english: "Wow! That's amazing.", korean: "와! 정말 놀라워요.", uzbek: "Voy! Bu ajoyib." }],
  },
};
