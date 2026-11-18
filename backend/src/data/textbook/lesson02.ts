import type { TextbookLessonSeed } from "./types";
import { lesson01 } from "./lesson01";

// Lv.0 "Hello English", 2과 "How is your day?" — transcribed from the Pallo!
// textbook, pages 14–19. Puzzle answers follow the book's 진행자용 정답 line
// (not the handwritten notes on the photographed copy). Korean text is the
// book's; Uzbek text is this app's translation.
//
// Pages 14–15 (part-of-speech guide, 동사 한눈에 보기, 변형 한눈에 보기) are
// the same in every lesson, so they are reused from lesson 1.
export const lesson02: TextbookLessonSeed = {
  level: 0,
  lessonNumber: 2,
  title: "How is your day?",
  titleKo: "오늘 컨디션 어때요?",
  titleUz: "Bugun kayfiyating qanday?",

  partOfSpeechGuide: lesson01.partOfSpeechGuide,
  verbTypes: lesson01.verbTypes,
  verbRuleKo: lesson01.verbRuleKo,
  verbRuleUz: lesson01.verbRuleUz,
  shapeTransforms: lesson01.shapeTransforms,
  subjectTenseTransforms: lesson01.subjectTenseTransforms,
  imperative: lesson01.imperative,

  // 0. 오늘의 키워드 15
  keywords: [
    { word: "Water", pronunciationKo: "워터", korean: "물", uzbek: "suv", partOfSpeech: "noun" },
    { word: "Coffee", pronunciationKo: "커피", korean: "커피", uzbek: "qahva", partOfSpeech: "noun" },
    { word: "Bed", pronunciationKo: "베드", korean: "침대", uzbek: "karavot", partOfSpeech: "noun" },
    { word: "Class", pronunciationKo: "클래스", korean: "수업", uzbek: "dars", partOfSpeech: "noun" },
    { word: "Head", pronunciationKo: "헤드", korean: "머리", uzbek: "bosh", partOfSpeech: "noun" },
    { word: "Sleep", pronunciationKo: "슬립", korean: "자다", uzbek: "uxlamoq", partOfSpeech: "verb" },
    { word: "Drink", pronunciationKo: "드링크", korean: "마시다", uzbek: "ichmoq", partOfSpeech: "verb" },
    { word: "Rest", pronunciationKo: "레스트", korean: "쉬다", uzbek: "dam olmoq", partOfSpeech: "verb" },
    { word: "Walk", pronunciationKo: "웍", korean: "걷다", uzbek: "yurmoq, piyoda yurmoq", partOfSpeech: "verb" },
    { word: "Feel", pronunciationKo: "필", korean: "느끼다", uzbek: "his qilmoq", partOfSpeech: "verb" },
    { word: "Sleepy", pronunciationKo: "슬리피", korean: "졸린", uzbek: "uyqusi kelgan", partOfSpeech: "adjective" },
    { word: "Sick", pronunciationKo: "식", korean: "아픈", uzbek: "kasal", partOfSpeech: "adjective" },
    { word: "Good", pronunciationKo: "굿", korean: "좋은", uzbek: "yaxshi", partOfSpeech: "adjective" },
    { word: "Fine", pronunciationKo: "파인", korean: "괜찮은", uzbek: "yaxshi, joyida", partOfSpeech: "adjective" },
    { word: "Awake", pronunciationKo: "어웨이크", korean: "깨어 있는", uzbek: "uyg'oq", partOfSpeech: "adjective" },
  ],

  // 1. 오늘의 퍼즐 — 진행자 시범
  puzzles: [
    {
      verbType: "be_verb",
      baseSentence: "I am sleepy.",
      baseMeaningKo: "졸린",
      baseMeaningUz: "Uyqum kelyapti.",
      pronunciationKo: "아이 엠 슬리피",
      rows: [
        { key: "L2-P-be-negative", transform: "negative", prompt: "I am ___ sleepy.", answers: ["not"], hintKo: "be동사 뒤에 not", hintUz: "be fe'lidan keyin not" },
        { key: "L2-P-be-question", transform: "question", prompt: "___ you sleepy?", answers: ["Are"], hintKo: "be동사를 맨 앞으로", hintUz: "be fe'lini eng boshiga" },
        { key: "L2-P-be-wh", transform: "wh_question", prompt: "___ are you sleepy?", answers: ["Why"], hintKo: "의문사를 맨 앞에", hintUz: "So'roq so'zini eng boshiga" },
        { key: "L2-P-be-subject", transform: "subject", prompt: "She ___ sleepy.", answers: ["is"], hintKo: "He · She · It → is", hintUz: "He · She · It → is" },
        { key: "L2-P-be-past", transform: "past", prompt: "I ___ sleepy.", answers: ["was"], hintKo: "am · is → was", hintUz: "am · is → was" },
        { key: "L2-P-be-future", transform: "future", prompt: "I ___ sleepy.", answers: ["will be"], hintKo: "will + be", hintUz: "will + be" },
      ],
    },
    {
      verbType: "general_verb",
      baseSentence: "I drink water.",
      baseMeaningKo: "물을 마시다",
      baseMeaningUz: "Men suv ichaman.",
      pronunciationKo: "아이 드링크 워터",
      rows: [
        { key: "L2-P-gen-negative", transform: "negative", prompt: "I ___ drink water.", answers: ["don't", "do not"], hintKo: "don't + 동사원형", hintUz: "don't + fe'lning asosiy shakli" },
        { key: "L2-P-gen-question", transform: "question", prompt: "___ you drink water?", answers: ["Do"], hintKo: "Do를 맨 앞으로", hintUz: "Do eng boshiga" },
        { key: "L2-P-gen-wh", transform: "wh_question", prompt: "___ do you drink water?", answers: ["When"], hintKo: "의문사 + do you ~?", hintUz: "So'roq so'zi + do you ~?" },
        { key: "L2-P-gen-subject", transform: "subject", prompt: "She ___ water.", answers: ["drinks"], hintKo: "He · She · It → 동사 + s", hintUz: "He · She · It → fe'l + s" },
        { key: "L2-P-gen-past", transform: "past", prompt: "I ___ water.", answers: ["drank"], hintKo: "과거형 (불규칙은 부록)", hintUz: "O'tgan zamon shakli (noto'g'ri fe'llar ilovada)" },
        { key: "L2-P-gen-future", transform: "future", prompt: "I ___ drink water.", answers: ["will"], hintKo: "will + 동사원형", hintUz: "will + fe'lning asosiy shakli" },
        { key: "L2-P-gen-continuous", transform: "continuous", prompt: "I am ___ water.", answers: ["drinking"], hintKo: "be + 동사ing", hintUz: "be + fe'l+ing" },
        { key: "L2-P-gen-imperative", transform: "imperative", prompt: "___ water.", answers: ["Drink"], hintKo: "주어 없이 동사원형 (선택)", hintUz: "Egasiz, fe'lning asosiy shakli (ixtiyoriy)" },
      ],
    },
    {
      verbType: "modal_verb",
      baseSentence: "I can walk.",
      baseMeaningKo: "걷다",
      baseMeaningUz: "Men yura olaman.",
      pronunciationKo: "아이 캔 웍",
      rows: [
        { key: "L2-P-mod-negative", transform: "negative", prompt: "I ___ walk.", answers: ["can't", "cannot", "can not"], hintKo: "can + not", hintUz: "can + not" },
        { key: "L2-P-mod-question", transform: "question", prompt: "___ you walk?", answers: ["Can"], hintKo: "Can을 맨 앞으로", hintUz: "Can eng boshiga" },
        { key: "L2-P-mod-subject", transform: "subject", prompt: "She ___ walk.", answers: ["can"], hintKo: "can은 그대로", hintUz: "can o'zgarmaydi" },
      ],
    },
  ],

  // 2. Our Story — 1회차 I · 2회차 She · 3회차 He
  storyQuestions: [
    {
      key: "L2-Q1",
      question: "How is your day today?",
      pronunciationKo: "하우 이즈 유어 데이 투데이?",
      meaningKo: "오늘 하루 어때요?",
      meaningUz: "Bugun kuning qanday o'tyapti?",
      grammarType: "be_verb",
      examples: { 1: "My day is good.", 2: "Her day is good.", 3: "His day is good." },
    },
    {
      key: "L2-Q2",
      question: "What do you drink in the morning?",
      pronunciationKo: "왓 두 유 드링크 인 더 모닝?",
      meaningKo: "아침에 무엇을 마셔요?",
      meaningUz: "Ertalab nima ichasan?",
      grammarType: "general_verb",
      examples: {
        1: "I drink coffee in the morning.",
        2: "She drinks coffee in the morning.",
        3: "He drinks coffee in the morning.",
      },
    },
    {
      key: "L2-Q3",
      question: "What can you do for your health?",
      pronunciationKo: "왓 캔 유 두 포 유어 헬스?",
      meaningKo: "건강을 위해 무엇을 할 수 있어요?",
      meaningUz: "Sog'lig'ing uchun nima qila olasan?",
      grammarType: "modal",
      examples: { 1: "I can walk every day.", 2: "She can walk every day.", 3: "He can walk every day." },
    },
    {
      key: "L2-Q4",
      question: "What don't you drink at night?",
      pronunciationKo: "왓 돈츄 드링크 앳 나잇?",
      meaningKo: "밤에 무엇을 안 마셔요?",
      meaningUz: "Kechasi nimani ichmaysan?",
      grammarType: "negative",
      examples: {
        1: "I don't drink coffee at night.",
        2: "She doesn't drink coffee at night.",
        3: "He doesn't drink coffee at night.",
      },
    },
    {
      key: "L2-Q5",
      question: "How did you sleep last night?",
      pronunciationKo: "하우 디쥬 슬립 래스트 나잇?",
      meaningKo: "어젯밤에 잘 잤어요?",
      meaningUz: "Kecha kechasi yaxshi uxladingmi?",
      grammarType: "past",
      examples: { 1: "I slept well.", 2: "She slept well.", 3: "He slept well." },
    },
    {
      key: "L2-Q6",
      question: "What will you do after class?",
      pronunciationKo: "왓 윌 유 두 애프터 클래스?",
      meaningKo: "수업 끝나고 무엇을 할 거예요?",
      meaningUz: "Darsdan keyin nima qilasan?",
      grammarType: "future",
      examples: { 1: "I will rest at home.", 2: "She will rest at home.", 3: "He will rest at home." },
    },
    {
      key: "L2-Q7",
      question: "What are you drinking now?",
      pronunciationKo: "왓 아 유 드링킹 나우?",
      meaningKo: "지금 무엇을 마시고 있어요?",
      meaningUz: "Hozir nima ichyapsan?",
      grammarType: "continuous",
      examples: { 1: "I am drinking water.", 2: "She is drinking water.", 3: "He is drinking water." },
    },
  ],

  // Be동사 / 일반동사 / 조동사 ajratish testi — words from this lesson's sentences.
  verbClassificationQuiz: [
    { key: "L2-V-am", word: "am", correctType: "be_verb", exampleSentence: "I am sleepy." },
    { key: "L2-V-drink", word: "drink", correctType: "general_verb", exampleSentence: "I drink water." },
    { key: "L2-V-can", word: "can", correctType: "modal_verb", exampleSentence: "I can walk." },
    { key: "L2-V-are", word: "are", correctType: "be_verb", exampleSentence: "Are you sick?" },
    { key: "L2-V-feel", word: "feel", correctType: "general_verb", exampleSentence: "I feel good today." },
    { key: "L2-V-should", word: "should", correctType: "modal_verb", exampleSentence: "You should rest." },
    { key: "L2-V-is", word: "is", correctType: "be_verb", exampleSentence: "My day is good." },
    { key: "L2-V-sleep", word: "sleep", correctType: "general_verb", exampleSentence: "Did you sleep late?" },
    { key: "L2-V-will", word: "will", correctType: "modal_verb", exampleSentence: "I will rest at home." },
    { key: "L2-V-was", word: "was", correctType: "be_verb", exampleSentence: "I was sleepy." },
    { key: "L2-V-walked", word: "walked", correctType: "general_verb", exampleSentence: "I walked to class." },
    { key: "L2-V-rest", word: "rest", correctType: "general_verb", exampleSentence: "I will rest this weekend." },
  ],

  // 3. 스스로 변형하기 — 칸 아래의 우리말을 보고 위에 영어로 씁니다.
  selfTransform: [
    {
      key: "L2-S1",
      titleKo: "① 현재 · 주어 I",
      titleUz: "① Hozirgi zamon · ega I",
      rows: [
        { key: "L2-S1-base", labelKo: "기본문장", labelUz: "Asosiy gap", promptKo: "나는 물을 마신다.", promptUz: "Men suv ichaman.", answers: ["I drink water."], grammarType: "general_verb", given: true },
        { key: "L2-S1-neg", labelKo: "부정하기", labelUz: "Inkor", promptKo: "나는 물을 마시지 않는다.", promptUz: "Men suv ichmayman.", answers: ["I don't drink water.", "I do not drink water."], grammarType: "negative" },
        { key: "L2-S1-q", labelKo: "물어보기", labelUz: "So'rash", promptKo: "나는 물을 마시니?", promptUz: "Men suv ichamanmi?", answers: ["Do I drink water?"], grammarType: "question" },
        { key: "L2-S1-wh", labelKo: "의문사 물어보기", labelUz: "So'roq so'zi bilan", promptKo: "나는 언제 물을 마시니?", promptUz: "Men qachon suv ichaman?", answers: ["When do I drink water?"], grammarType: "wh_question" },
        { key: "L2-S1-obj", labelKo: "목적어 바꾸기 → tea", labelUz: "To'ldiruvchini almashtirish → tea", promptKo: "나는 차를 마신다.", promptUz: "Men choy ichaman.", answers: ["I drink tea."], grammarType: "general_verb" },
        { key: "L2-S1-verb", labelKo: "동사 바꾸기 → want", labelUz: "Fe'lni almashtirish → want", promptKo: "나는 물을 원한다.", promptUz: "Men suv xohlayman.", answers: ["I want water."], grammarType: "general_verb" },
        { key: "L2-S1-ing", labelKo: "진행형 (be+ing)", labelUz: "Davomli (be+ing)", promptKo: "나는 물을 마시고 있다.", promptUz: "Men suv ichyapman.", answers: ["I am drinking water.", "I'm drinking water."], grammarType: "continuous" },
        { key: "L2-S1-will", labelKo: "조동사 will", labelUz: "Yordamchi fe'l will", promptKo: "나는 물을 마실 것이다.", promptUz: "Men suv ichaman (keyin).", answers: ["I will drink water.", "I'll drink water."], grammarType: "future" },
      ],
    },
    {
      key: "L2-S2",
      titleKo: "② 과거 · 주어 I",
      titleUz: "② O'tgan zamon · ega I",
      rows: [
        { key: "L2-S2-base", labelKo: "기본문장", labelUz: "Asosiy gap", promptKo: "나는 물을 마셨다.", promptUz: "Men suv ichdim.", answers: ["I drank water."], grammarType: "past" },
        { key: "L2-S2-neg", labelKo: "부정하기", labelUz: "Inkor", promptKo: "나는 물을 마시지 않았다.", promptUz: "Men suv ichmadim.", answers: ["I didn't drink water.", "I did not drink water."], grammarType: "past" },
        { key: "L2-S2-q", labelKo: "물어보기", labelUz: "So'rash", promptKo: "나는 물을 마셨니?", promptUz: "Men suv ichdimmi?", answers: ["Did I drink water?"], grammarType: "past" },
        { key: "L2-S2-wh", labelKo: "의문사 물어보기", labelUz: "So'roq so'zi bilan", promptKo: "나는 언제 물을 마셨니?", promptUz: "Men qachon suv ichdim?", answers: ["When did I drink water?"], grammarType: "past" },
        { key: "L2-S2-obj", labelKo: "목적어 바꾸기 → tea", labelUz: "To'ldiruvchini almashtirish → tea", promptKo: "나는 차를 마셨다.", promptUz: "Men choy ichdim.", answers: ["I drank tea."], grammarType: "past" },
        { key: "L2-S2-verb", labelKo: "동사 바꾸기 → want", labelUz: "Fe'lni almashtirish → want", promptKo: "나는 물을 원했다.", promptUz: "Men suv xohladim.", answers: ["I wanted water."], grammarType: "past" },
        { key: "L2-S2-ing", labelKo: "진행형 (be+ing)", labelUz: "Davomli (be+ing)", promptKo: "나는 물을 마시고 있었다.", promptUz: "Men suv ichayotgan edim.", answers: ["I was drinking water."], grammarType: "continuous" },
      ],
    },
    {
      key: "L2-S3",
      titleKo: "③ 현재 · 주어 She",
      titleUz: "③ Hozirgi zamon · ega She",
      rows: [
        { key: "L2-S3-base", labelKo: "기본문장", labelUz: "Asosiy gap", promptKo: "그녀는 물을 마신다.", promptUz: "U (qiz) suv ichadi.", answers: ["She drinks water."], grammarType: "subject" },
        { key: "L2-S3-neg", labelKo: "부정하기", labelUz: "Inkor", promptKo: "그녀는 물을 마시지 않는다.", promptUz: "U (qiz) suv ichmaydi.", answers: ["She doesn't drink water.", "She does not drink water."], grammarType: "negative" },
        { key: "L2-S3-q", labelKo: "물어보기", labelUz: "So'rash", promptKo: "그녀는 물을 마시니?", promptUz: "U (qiz) suv ichadimi?", answers: ["Does she drink water?"], grammarType: "question" },
        { key: "L2-S3-wh", labelKo: "의문사 물어보기", labelUz: "So'roq so'zi bilan", promptKo: "그녀는 언제 물을 마시니?", promptUz: "U (qiz) qachon suv ichadi?", answers: ["When does she drink water?"], grammarType: "wh_question" },
        { key: "L2-S3-obj", labelKo: "목적어 바꾸기 → tea", labelUz: "To'ldiruvchini almashtirish → tea", promptKo: "그녀는 차를 마신다.", promptUz: "U (qiz) choy ichadi.", answers: ["She drinks tea."], grammarType: "subject" },
        { key: "L2-S3-verb", labelKo: "동사 바꾸기 → want", labelUz: "Fe'lni almashtirish → want", promptKo: "그녀는 물을 원한다.", promptUz: "U (qiz) suv xohlaydi.", answers: ["She wants water."], grammarType: "subject" },
        { key: "L2-S3-ing", labelKo: "진행형 (be+ing)", labelUz: "Davomli (be+ing)", promptKo: "그녀는 물을 마시고 있다.", promptUz: "U (qiz) suv ichyapti.", answers: ["She is drinking water.", "She's drinking water."], grammarType: "continuous" },
        { key: "L2-S3-will", labelKo: "조동사 will", labelUz: "Yordamchi fe'l will", promptKo: "그녀는 물을 마실 것이다.", promptUz: "U (qiz) suv ichadi (keyin).", answers: ["She will drink water.", "She'll drink water."], grammarType: "future" },
      ],
    },
    {
      key: "L2-S4",
      titleKo: "④ 과거 · 주어 She",
      titleUz: "④ O'tgan zamon · ega She",
      rows: [
        { key: "L2-S4-base", labelKo: "기본문장", labelUz: "Asosiy gap", promptKo: "그녀는 물을 마셨다.", promptUz: "U (qiz) suv ichdi.", answers: ["She drank water."], grammarType: "past" },
        { key: "L2-S4-neg", labelKo: "부정하기", labelUz: "Inkor", promptKo: "그녀는 물을 마시지 않았다.", promptUz: "U (qiz) suv ichmadi.", answers: ["She didn't drink water.", "She did not drink water."], grammarType: "past" },
        { key: "L2-S4-q", labelKo: "물어보기", labelUz: "So'rash", promptKo: "그녀는 물을 마셨니?", promptUz: "U (qiz) suv ichdimi?", answers: ["Did she drink water?"], grammarType: "past" },
        { key: "L2-S4-wh", labelKo: "의문사 물어보기", labelUz: "So'roq so'zi bilan", promptKo: "그녀는 언제 물을 마셨니?", promptUz: "U (qiz) qachon suv ichdi?", answers: ["When did she drink water?"], grammarType: "past" },
        { key: "L2-S4-obj", labelKo: "목적어 바꾸기 → tea", labelUz: "To'ldiruvchini almashtirish → tea", promptKo: "그녀는 차를 마셨다.", promptUz: "U (qiz) choy ichdi.", answers: ["She drank tea."], grammarType: "past" },
        { key: "L2-S4-verb", labelKo: "동사 바꾸기 → want", labelUz: "Fe'lni almashtirish → want", promptKo: "그녀는 물을 원했다.", promptUz: "U (qiz) suv xohladi.", answers: ["She wanted water."], grammarType: "past" },
        { key: "L2-S4-ing", labelKo: "진행형 (be+ing)", labelUz: "Davomli (be+ing)", promptKo: "그녀는 물을 마시고 있었다.", promptUz: "U (qiz) suv ichayotgan edi.", answers: ["She was drinking water."], grammarType: "continuous" },
      ],
    },
    {
      key: "L2-S5",
      titleKo: "⑤ 명령문 · 주어 없이 동사원형 (여유가 있을 때)",
      titleUz: "⑤ Buyruq gap · egasiz, fe'lning asosiy shakli (vaqt bo'lsa)",
      rows: [
        { key: "L2-S5-imp", labelKo: "명령문", labelUz: "Buyruq", promptKo: "물을 마셔라.", promptUz: "Suv ich.", answers: ["Drink water."], grammarType: "imperative" },
        { key: "L2-S5-neg", labelKo: "부정 명령문", labelUz: "Inkor buyruq", promptKo: "물을 마시지 마라.", promptUz: "Suv ichma.", answers: ["Don't drink water.", "Do not drink water."], grammarType: "imperative" },
      ],
    },
  ],

  // 4. 문장 연습 — 영어를 소리 내어 읽고 우리말 뜻을 확인한 뒤, 우리말만 보고 영어로 말해 봅니다.
  sentencePractice: [
    { key: "L2-SP01", english: "I don't know his name.", pronunciationKo: "아이 돈트 노우 히즈 네임", korean: "저는 그의 이름을 몰라요.", uzbek: "Men uning ismini bilmayman." },
    { key: "L2-SP02", english: "Is he old?", pronunciationKo: "이즈 히 올드?", korean: "그는 나이가 많나요?", uzbek: "U yoshi kattami?" },
    { key: "L2-SP03", english: "I won't be late.", pronunciationKo: "아이 워운트 비 레잇", korean: "늦지 않을게요.", uzbek: "Kechikmayman." },
    { key: "L2-SP04", english: "Do you want more?", pronunciationKo: "두 유 원트 모얼?", korean: "더 원하세요?", uzbek: "Yana xohlaysizmi?" },
    { key: "L2-SP05", english: "We watched a movie last night.", pronunciationKo: "위 워치트 어 무비 라스트 나잇", korean: "우리는 어젯밤에 영화를 봤어요.", uzbek: "Kecha kechqurun kino ko'rdik." },
    { key: "L2-SP06", english: "She should see a doctor.", pronunciationKo: "쉬 슈드 씨 어 닥터", korean: "그녀는 병원에 가 보는 게 좋아요.", uzbek: "U shifokorga ko'rinishi kerak." },
    { key: "L2-SP07", english: "When does the class start?", pronunciationKo: "웬 더즈 더 클래스 스타트?", korean: "수업이 언제 시작하나요?", uzbek: "Dars qachon boshlanadi?" },
    { key: "L2-SP08", english: "You study hard.", pronunciationKo: "유 스터디 하드", korean: "당신은 열심히 공부하네요.", uzbek: "Siz astoydil o'qiysiz." },
    { key: "L2-SP09", english: "You slept in the car.", pronunciationKo: "유 슬렙트 인 더 카", korean: "당신은 차에서 잤어요.", uzbek: "Siz mashinada uxladingiz." },
    { key: "L2-SP10", english: "Are they brothers?", pronunciationKo: "알 데이 브라더스?", korean: "그들은 형제인가요?", uzbek: "Ular aka-ukami?" },
    { key: "L2-SP11", english: "I am sleepy now.", pronunciationKo: "아이 엠 슬리피 나우", korean: "저는 지금 졸려요.", uzbek: "Hozir uyqum kelyapti." },
    { key: "L2-SP12", english: "Are you sick?", pronunciationKo: "알 유 씩?", korean: "아프세요?", uzbek: "Kasalmisiz?" },
    { key: "L2-SP13", english: "I feel good today.", pronunciationKo: "아이 필 굳 투데이", korean: "오늘 기분이 좋아요.", uzbek: "Bugun kayfiyatim yaxshi." },
    { key: "L2-SP14", english: "He doesn't drink water.", pronunciationKo: "히 더즌트 드링크 워러", korean: "그는 물을 안 마셔요.", uzbek: "U suv ichmaydi." },
    { key: "L2-SP15", english: "Did you sleep late?", pronunciationKo: "디드 유 슬립 레잇?", korean: "늦잠 잤어요?", uzbek: "Kech turdingizmi?" },
    { key: "L2-SP16", english: "I walked to class.", pronunciationKo: "아이 웍트 투 클래스", korean: "저는 수업에 걸어왔어요.", uzbek: "Darsga piyoda keldim." },
    { key: "L2-SP17", english: "You should rest.", pronunciationKo: "유 슈드 레스트", korean: "쉬는 게 좋아요.", uzbek: "Dam olishingiz kerak." },
    { key: "L2-SP18", english: "My head hurts.", pronunciationKo: "마이 헤드 헐츠", korean: "머리가 아파요.", uzbek: "Boshim og'riyapti." },
    { key: "L2-SP19", english: "I will go to bed early.", pronunciationKo: "아이 윌 고 투 베드 얼리", korean: "일찍 잘 거예요.", uzbek: "Erta yotaman." },
    { key: "L2-SP20", english: "She is drinking coffee.", pronunciationKo: "쉬 이즈 드링킹 커피", korean: "그녀는 커피를 마시고 있어요.", uzbek: "U qahva ichyapti." },
    { key: "L2-SP21", english: "I feel fine.", pronunciationKo: "아이 필 파인", korean: "저는 괜찮아요.", uzbek: "Men yaxshiman." },
    { key: "L2-SP22", english: "Are you awake?", pronunciationKo: "알 유 어웨이크?", korean: "깨어 있어요?", uzbek: "Uyg'oqmisiz?" },
    { key: "L2-SP23", english: "I slept well last night.", pronunciationKo: "아이 슬렙트 웰 라스트 나잇", korean: "어젯밤에 잘 잤어요.", uzbek: "Kecha yaxshi uxladim." },
    { key: "L2-SP24", english: "Do you drink water every day?", pronunciationKo: "두 유 드링크 워러 에브리 데이?", korean: "매일 물을 마셔요?", uzbek: "Har kuni suv ichasizmi?" },
    { key: "L2-SP25", english: "I will rest this weekend.", pronunciationKo: "아이 윌 레스트 디스 위켄드", korean: "이번 주말에 쉴 거예요.", uzbek: "Shu dam olish kunlari dam olaman." },
  ],

  // 프리토킹 — 오늘 주제로 자유롭게 이야기해 봅니다.
  freeTalk: [
    {
      key: "L2-FT1",
      question: "What do you do when you are tired?",
      pronunciationKo: "왓 두 유 두 웬 유 알 타이얼드?",
      meaningKo: "피곤할 때 무엇을 해요?",
      meaningUz: "Charchaganingizda nima qilasiz?",
    },
    {
      key: "L2-FT2",
      question: "How many hours do you sleep?",
      pronunciationKo: "하우 매니 아워즈 두 유 슬립?",
      meaningKo: "몇 시간 자요?",
      meaningUz: "Necha soat uxlaysiz?",
    },
  ],
};
