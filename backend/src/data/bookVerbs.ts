// Verb tables from the Pallo! textbook appendix (p.48 ① regular verbs,
// p.50 ②–⑤ irregular verb groups). Seeded insert-only into IrregularVerb on
// server start (see services/irregularVerbs.service.ts syncBookVerbs): new
// verbs are added, verbs already in the database keep their admin-edited
// fields and only get the -ing form filled in when it's missing.

export interface BookVerb {
  base: string;
  past: string;
  participle: string;
  ing: string;
  korean: string;
  uzbek: string;
  regular?: boolean;
}

const r = (base: string, past: string, ing: string, korean: string, uzbek: string): BookVerb => ({
  base,
  past,
  participle: past,
  ing,
  korean,
  uzbek,
  regular: true,
});

// ① 규칙 동사 — past and past participle both -ed (p.48).
export const REGULAR_BOOK_VERBS: BookVerb[] = [
  r("play", "played", "playing", "놀다 · 연주하다", "o'ynamoq, chalmoq"),
  r("walk", "walked", "walking", "걷다", "yurmoq"),
  r("work", "worked", "working", "일하다", "ishlamoq"),
  r("study", "studied", "studying", "공부하다", "o'qimoq, o'rganmoq"),
  r("watch", "watched", "watching", "보다", "tomosha qilmoq"),
  r("learn", "learned", "learning", "배우다", "o'rganmoq"),
  r("listen", "listened", "listening", "듣다", "tinglamoq"),
  r("believe", "believed", "believing", "믿다", "ishonmoq"),
  r("like", "liked", "liking", "좋아하다", "yoqtirmoq"),
  r("hate", "hated", "hating", "싫어하다", "yomon ko'rmoq"),
  r("love", "loved", "loving", "사랑하다", "sevmoq"),
  r("use", "used", "using", "사용하다", "foydalanmoq"),
  r("want", "wanted", "wanting", "원하다", "xohlamoq"),
  r("need", "needed", "needing", "필요하다", "kerak bo'lmoq"),
  r("pass", "passed", "passing", "통과하다 · 건너다", "o'tmoq"),
  r("fail", "failed", "failing", "실패하다", "muvaffaqiyatsiz bo'lmoq, yiqilmoq"),
  r("remember", "remembered", "remembering", "기억하다", "eslamoq"),
  r("travel", "traveled", "traveling", "여행하다", "sayohat qilmoq"),
  r("call", "called", "calling", "부르다 · 전화하다", "chaqirmoq, qo'ng'iroq qilmoq"),
  r("ask", "asked", "asking", "묻다 · 부탁하다", "so'ramoq"),
  r("answer", "answered", "answering", "대답하다", "javob bermoq"),
  r("start", "started", "starting", "시작하다", "boshlamoq"),
  r("stop", "stopped", "stopping", "멈추다", "to'xtamoq"),
  r("plan", "planned", "planning", "계획하다", "rejalashtirmoq"),
  r("shop", "shopped", "shopping", "쇼핑하다", "xarid qilmoq"),
  r("cook", "cooked", "cooking", "요리하다", "ovqat pishirmoq"),
  r("clean", "cleaned", "cleaning", "청소하다", "tozalamoq"),
  r("open", "opened", "opening", "열다", "ochmoq"),
  r("close", "closed", "closing", "닫다", "yopmoq"),
  r("live", "lived", "living", "살다", "yashamoq"),
];

// Irregular verbs from p.50 that the database didn't have yet.
export const NEW_IRREGULAR_BOOK_VERBS: BookVerb[] = [
  { base: "understand", past: "understood", participle: "understood", ing: "understanding", korean: "이해하다", uzbek: "tushunmoq" },
  { base: "shut", past: "shut", participle: "shut", ing: "shutting", korean: "닫다", uzbek: "yopmoq" },
  { base: "cost", past: "cost", participle: "cost", ing: "costing", korean: "(돈이) 들다", uzbek: "turmoq (narxi)" },
  { base: "quit", past: "quit", participle: "quit", ing: "quitting", korean: "그만두다", uzbek: "tashlamoq, to'xtatmoq" },
  { base: "be", past: "was / were", participle: "been", ing: "being", korean: "~이다 · 있다", uzbek: "bo'lmoq" },
];

// -ing forms printed in the book for verbs the database already has.
export const BOOK_ING_FORMS: Record<string, string> = {
  sit: "sitting",
  stand: "standing",
  get: "getting",
  cut: "cutting",
  hit: "hitting",
  hurt: "hurting",
  put: "putting",
  let: "letting",
  set: "setting",
  read: "reading",
  come: "coming",
  become: "becoming",
  run: "running",
  "do, does": "doing",
  go: "going",
  see: "seeing",
  eat: "eating",
  drink: "drinking",
  sing: "singing",
};
