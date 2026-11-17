import type { TextbookLessonSeed } from "./types";

// Lv.0 "Hello English", 1과 "Nice to meet you" — transcribed from the Pallo!
// textbook, pages 8–11.
// Korean text is the book's; Uzbek text is this app's translation.
export const lesson01: TextbookLessonSeed = {
  level: 0,
  lessonNumber: 1,
  title: "Nice to meet you",
  titleKo: "처음 만나서 반가워요",
  titleUz: "Tanishganimdan xursandman",

  // 품사가 헷갈리면 아래 설명을 다시 봅니다.
  partOfSpeechGuide: [
    {
      partOfSpeech: "noun",
      descriptionKo: "사람 · 사물 · 장소의 이름",
      descriptionUz: "Odam, narsa yoki joyning nomi",
      exampleKo: "bread 빵, friend 친구",
      exampleUz: "bread — non, friend — do'st",
    },
    {
      partOfSpeech: "verb",
      descriptionKo: "~하다 (동작 · 생각 · 감정)",
      descriptionUz: "...moq (harakat, fikr, his-tuyg'u)",
      exampleKo: "eat 먹다, like 좋아하다",
      exampleUz: "eat — yemoq, like — yoqtirmoq",
    },
    {
      partOfSpeech: "adjective",
      descriptionKo: "상태 · 모양을 말하는 말 (~한)",
      descriptionUz: "Holat yoki ko'rinishni bildiradi",
      exampleKo: "happy 행복한, busy 바쁜",
      exampleUz: "happy — baxtli, busy — band",
    },
  ],

  // 0. 오늘의 키워드 15
  keywords: [
    { word: "Bread", pronunciationKo: "브레드", korean: "빵", uzbek: "non", partOfSpeech: "noun" },
    { word: "Fish", pronunciationKo: "피시", korean: "생선", uzbek: "baliq", partOfSpeech: "noun" },
    { word: "Movie", pronunciationKo: "무비", korean: "영화", uzbek: "kino, film", partOfSpeech: "noun" },
    { word: "Friend", pronunciationKo: "프렌드", korean: "친구", uzbek: "do'st", partOfSpeech: "noun" },
    { word: "Breakfast", pronunciationKo: "브렉퍼스트", korean: "아침밥", uzbek: "nonushta", partOfSpeech: "noun" },
    { word: "Eat", pronunciationKo: "잇", korean: "먹다", uzbek: "yemoq", partOfSpeech: "verb" },
    { word: "Swim", pronunciationKo: "스윔", korean: "수영하다", uzbek: "suzmoq", partOfSpeech: "verb" },
    { word: "Watch", pronunciationKo: "워치", korean: "보다", uzbek: "tomosha qilmoq", partOfSpeech: "verb" },
    { word: "Meet", pronunciationKo: "밋", korean: "만나다", uzbek: "uchrashmoq", partOfSpeech: "verb" },
    { word: "Study", pronunciationKo: "스터디", korean: "공부하다", uzbek: "o'qimoq, o'rganmoq", partOfSpeech: "verb" },
    { word: "Happy", pronunciationKo: "해피", korean: "행복한", uzbek: "baxtli", partOfSpeech: "adjective" },
    { word: "Tired", pronunciationKo: "타이어드", korean: "피곤한", uzbek: "charchagan", partOfSpeech: "adjective" },
    { word: "Busy", pronunciationKo: "비지", korean: "바쁜", uzbek: "band", partOfSpeech: "adjective" },
    { word: "Glad", pronunciationKo: "글래드", korean: "기쁜", uzbek: "xursand", partOfSpeech: "adjective" },
    { word: "Nice", pronunciationKo: "나이스", korean: "좋은 · 친절한", uzbek: "yaxshi, yoqimli", partOfSpeech: "adjective" },
  ],

  // 동사 한눈에 보기 — 매 수업 이 도식을 한 번씩 말하고 시작합니다.
  verbTypes: [
    {
      type: "general_verb",
      meaningKo: "~하다 (동작 · 생각 · 감정)",
      meaningUz: "...moq (harakat, fikr, his-tuyg'u)",
      examples: ["love", "eat", "go", "study"],
      baseSentence: "I love you.",
    },
    {
      type: "be_verb",
      meaningKo: "~이다 · ~한 상태다",
      meaningUz: "...dir, ... holatda bo'lmoq",
      examples: ["am", "is", "are"],
      baseSentence: "I am happy.",
    },
    {
      type: "modal_verb",
      meaningKo: "동사를 도와주는 말 (+ 동사원형)",
      meaningUz: "Fe'lga yordam beradi (+ fe'lning asosiy shakli)",
      examples: ["can", "will", "should"],
      baseSentence: "I can swim.",
    },
  ],
  verbRuleKo: "be동사(am · are · is)와 조동사(can · will · should)를 뺀 나머지 동사는 모두 일반동사입니다.",
  verbRuleUz: "be fe'llari (am, are, is) va yordamchi fe'llardan (can, will, should) boshqa barcha fe'llar — oddiy fe'llardir.",

  // 변형 한눈에 보기 ① 문장 모양 바꾸기 (기본 문장에서 오른쪽으로 한 칸씩)
  shapeTransforms: [
    { transform: "base", ruleKo: "", ruleUz: "", sentences: ["I am happy.", "I love you.", "I can swim."] },
    {
      transform: "negative",
      ruleKo: "+ not",
      ruleUz: "+ not",
      sentences: ["I am not happy.", "I don't love you.", "I can't swim."],
    },
    {
      transform: "question",
      ruleKo: "자리 바꾸기",
      ruleUz: "O'rnini almashtirish",
      sentences: ["Are you happy?", "Do you love me?", "Can you swim?"],
    },
    {
      transform: "wh_question",
      ruleKo: "의문사 맨 앞",
      ruleUz: "So'roq so'zi eng boshida",
      sentences: ["Why are you happy?", "Why do you love me?", "When can you swim?"],
    },
  ],

  // ② 주어 · 시제 바꾸기 (기본 문장에서 아래로)
  subjectTenseTransforms: [
    {
      transform: "subject",
      ruleKo: "I → She",
      ruleUz: "I → She",
      sentences: ["She is happy.", "She loves you.", "She can swim."],
      noteKo: "일반동사는 +s",
      noteUz: "Oddiy fe'lga +s qo'shiladi",
    },
    {
      transform: "past",
      ruleKo: "was · 동사ed",
      ruleUz: "was · fe'l+ed",
      sentences: ["I was happy.", "I loved you."],
      noteKo: "조동사 과거 × (0레벨)",
      noteUz: "Yordamchi fe'lning o'tgan zamoni yo'q (0-daraja)",
    },
    {
      transform: "future",
      ruleKo: "will + 원형",
      ruleUz: "will + asosiy shakl",
      sentences: ["I will be happy.", "I will love you."],
      noteKo: "will can ×",
      noteUz: "will can deyilmaydi",
    },
    {
      transform: "continuous",
      ruleKo: "be + 동사ing",
      ruleUz: "be + fe'l+ing",
      sentences: ["I am studying."],
      noteKo: "= 지금 공부하는 중",
      noteUz: "= hozir o'qiyapman",
    },
  ],

  // + 명령문
  imperative: {
    ruleKo: "(주제에 맞을 때) 주어 you를 빼고 동사원형으로 시작",
    ruleUz: "(Mavzuga mos kelsa) ega you tushib qoladi, gap fe'lning asosiy shakli bilan boshlanadi",
    examples: ["Be happy.", "Love me."],
    dontRuleKo: "하지 마 = Don't + 동사원형",
    dontRuleUz: "...ma = Don't + fe'lning asosiy shakli",
    dontExample: "Don't go.",
  },

  // 1. 오늘의 퍼즐 — 진행자 시범
  puzzles: [
    {
      verbType: "be_verb",
      baseSentence: "I am happy.",
      baseMeaningKo: "행복한",
      baseMeaningUz: "Men baxtliman.",
      pronunciationKo: "아이 엠 해피",
      rows: [
        { key: "L1-P-be-negative", transform: "negative", prompt: "I am ___ happy.", answers: ["not"], hintKo: "be동사 뒤에 not", hintUz: "be fe'lidan keyin not" },
        { key: "L1-P-be-question", transform: "question", prompt: "___ you happy?", answers: ["Are"], hintKo: "be동사를 맨 앞으로", hintUz: "be fe'lini eng boshiga" },
        { key: "L1-P-be-wh", transform: "wh_question", prompt: "___ are you happy?", answers: ["Why"], hintKo: "의문사를 맨 앞에", hintUz: "So'roq so'zini eng boshiga" },
        { key: "L1-P-be-subject", transform: "subject", prompt: "She ___ happy.", answers: ["is"], hintKo: "He · She · It → is", hintUz: "He · She · It → is" },
        { key: "L1-P-be-past", transform: "past", prompt: "I ___ happy.", answers: ["was"], hintKo: "am · is → was", hintUz: "am · is → was" },
        { key: "L1-P-be-future", transform: "future", prompt: "I ___ happy.", answers: ["will be"], hintKo: "will + be", hintUz: "will + be" },
      ],
    },
    {
      verbType: "general_verb",
      baseSentence: "I study English.",
      baseMeaningKo: "영어를 공부하다",
      baseMeaningUz: "Men ingliz tilini o'rganaman.",
      pronunciationKo: "아이 스터디 잉글리시",
      rows: [
        { key: "L1-P-gen-negative", transform: "negative", prompt: "I ___ study English.", answers: ["don't", "do not"], hintKo: "don't + 동사원형", hintUz: "don't + fe'lning asosiy shakli" },
        { key: "L1-P-gen-question", transform: "question", prompt: "___ you study English?", answers: ["Do"], hintKo: "Do를 맨 앞으로", hintUz: "Do eng boshiga" },
        { key: "L1-P-gen-wh", transform: "wh_question", prompt: "___ do you study English?", answers: ["Why"], hintKo: "의문사 + do you ~?", hintUz: "So'roq so'zi + do you ~?" },
        { key: "L1-P-gen-subject", transform: "subject", prompt: "She ___ English.", answers: ["studies"], hintKo: "He · She · It → 동사 + s", hintUz: "He · She · It → fe'l + s" },
        { key: "L1-P-gen-past", transform: "past", prompt: "I ___ English.", answers: ["studied"], hintKo: "과거형 (불규칙은 부록)", hintUz: "O'tgan zamon shakli (noto'g'ri fe'llar ilovada)" },
        { key: "L1-P-gen-future", transform: "future", prompt: "I ___ study English.", answers: ["will"], hintKo: "will + 동사원형", hintUz: "will + fe'lning asosiy shakli" },
        { key: "L1-P-gen-continuous", transform: "continuous", prompt: "I am ___ English.", answers: ["studying"], hintKo: "be + 동사ing", hintUz: "be + fe'l+ing" },
      ],
    },
    {
      verbType: "modal_verb",
      baseSentence: "I can speak English.",
      baseMeaningKo: "영어를 말하다",
      baseMeaningUz: "Men inglizcha gapira olaman.",
      pronunciationKo: "아이 캔 스픽 잉글리시",
      rows: [
        { key: "L1-P-mod-negative", transform: "negative", prompt: "I ___ speak English.", answers: ["can't", "cannot", "can not"], hintKo: "can + not", hintUz: "can + not" },
        { key: "L1-P-mod-question", transform: "question", prompt: "___ you speak English?", answers: ["Can"], hintKo: "Can을 맨 앞으로", hintUz: "Can eng boshiga" },
        { key: "L1-P-mod-subject", transform: "subject", prompt: "She ___ speak English.", answers: ["can"], hintKo: "can은 그대로", hintUz: "can o'zgarmaydi" },
      ],
    },
  ],

  // 2. Our Story — 1회차 I · 2회차 She · 3회차 He
  storyQuestions: [
    {
      key: "L1-Q1",
      question: "How are you today?",
      pronunciationKo: "하우 아 유 투데이?",
      meaningKo: "오늘 기분 어때요?",
      meaningUz: "Bugun kayfiyating qanday?",
      grammarType: "be_verb",
      examples: { 1: "I am happy today.", 2: "She is happy today.", 3: "He is happy today." },
    },
    {
      key: "L1-Q2",
      question: "What do you eat for breakfast?",
      pronunciationKo: "왓 두 유 잇 포 브렉퍼스트?",
      meaningKo: "아침으로 무엇을 먹어요?",
      meaningUz: "Nonushtaga nima yeysan?",
      grammarType: "general_verb",
      examples: { 1: "I eat bread for breakfast.", 2: "She eats bread for breakfast.", 3: "He eats bread for breakfast." },
    },
    {
      key: "L1-Q3",
      question: "What can you do?",
      pronunciationKo: "왓 캔 유 두?",
      meaningKo: "무엇을 할 수 있어요?",
      meaningUz: "Nima qila olasan?",
      grammarType: "modal",
      examples: { 1: "I can swim.", 2: "She can swim.", 3: "He can swim." },
    },
    {
      key: "L1-Q4",
      question: "What don't you eat?",
      pronunciationKo: "왓 돈츄 잇?",
      meaningKo: "무엇을 안 먹어요?",
      meaningUz: "Nimani yemaysan?",
      grammarType: "negative",
      examples: { 1: "I don't eat fish.", 2: "She doesn't eat fish.", 3: "He doesn't eat fish." },
    },
    {
      key: "L1-Q5",
      question: "What did you do yesterday?",
      pronunciationKo: "왓 디쥬 두 예스터데이?",
      meaningKo: "어제 무엇을 했어요?",
      meaningUz: "Kecha nima qilding?",
      grammarType: "past",
      examples: {
        1: "I watched a movie yesterday.",
        2: "She watched a movie yesterday.",
        3: "He watched a movie yesterday.",
      },
    },
    {
      key: "L1-Q6",
      question: "What will you do this weekend?",
      pronunciationKo: "왓 윌 유 두 디스 위켄드?",
      meaningKo: "이번 주말에 무엇을 할 거예요?",
      meaningUz: "Shu dam olish kunlari nima qilasan?",
      grammarType: "future",
      examples: { 1: "I will meet my friend.", 2: "She will meet her friend.", 3: "He will meet his friend." },
    },
    {
      key: "L1-Q7",
      question: "What are you doing now?",
      pronunciationKo: "왓 아 유 두잉 나우?",
      meaningKo: "지금 무엇을 하고 있어요?",
      meaningUz: "Hozir nima qilyapsan?",
      grammarType: "continuous",
      examples: { 1: "I am studying English.", 2: "She is studying English.", 3: "He is studying English." },
    },
  ],

  // Be동사 / 일반동사 / 조동사 ajratish testi — built from this lesson's
  // 동사 한눈에 보기 lists and example sentences.
  verbClassificationQuiz: [
    { key: "L1-V-am", word: "am", correctType: "be_verb", exampleSentence: "I am happy." },
    { key: "L1-V-love", word: "love", correctType: "general_verb", exampleSentence: "I love you." },
    { key: "L1-V-can", word: "can", correctType: "modal_verb", exampleSentence: "I can swim." },
    { key: "L1-V-is", word: "is", correctType: "be_verb", exampleSentence: "She is happy." },
    { key: "L1-V-eat", word: "eat", correctType: "general_verb", exampleSentence: "I eat bread for breakfast." },
    { key: "L1-V-will", word: "will", correctType: "modal_verb", exampleSentence: "I will meet my friend." },
    { key: "L1-V-are", word: "are", correctType: "be_verb", exampleSentence: "Are you happy?" },
    { key: "L1-V-study", word: "study", correctType: "general_verb", exampleSentence: "I study English." },
    { key: "L1-V-should", word: "should", correctType: "modal_verb", exampleSentence: "You should study English." },
    { key: "L1-V-was", word: "was", correctType: "be_verb", exampleSentence: "I was happy." },
    { key: "L1-V-watch", word: "watched", correctType: "general_verb", exampleSentence: "I watched a movie yesterday." },
    { key: "L1-V-go", word: "go", correctType: "general_verb", exampleSentence: "Don't go." },
  ],
};
