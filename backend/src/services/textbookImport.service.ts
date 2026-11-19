import Anthropic from "@anthropic-ai/sdk";
import { AI_API_KEY } from "../config/env";
import { GRAMMAR_TYPES, KEYWORD_POS, TRANSFORMS, VERB_TYPES } from "../config/textbook";
import { lesson02 } from "../data/textbook/lesson02";
import type { TextbookLessonSeed } from "../data/textbook/types";

// AI import for the admin "Textbooks" page: photos of one Pallo! textbook
// lesson → a structured lesson draft (the same shape as src/data/textbook
// lessons). Claude Opus 5.5 reads the pages; the admin reviews the draft
// before publishing, so nothing here goes live on its own.

const MODEL = "claude-opus-5-5";
// USD per million tokens (Claude Opus 5.5 list price) — for the cost shown
// to the admin; an estimate, the Console bill is authoritative.
const PRICE_IN = 4;
const PRICE_OUT = 20;

export interface ImportImage {
  data: Buffer;
  mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif";
}

export interface ImportWarning {
  path: string;
  note: string;
}

export interface ImportResult {
  lesson: Omit<TextbookLessonSeed, "level" | "lessonNumber">;
  warnings: ImportWarning[];
  usage: { model: string; inputTokens: number; outputTokens: number; usd: number };
}

// ─── Output schema ─────────────────────────────────────────────────────────
// Given to the model in the prompt (the full lesson is too large a grammar
// for API structured outputs), then enforced by normalize() below.

const str = { type: "string" };
const strArr = { type: "array", items: str };
const obj = (properties: Record<string, unknown>) => ({
  type: "object",
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
});
const arr = (items: unknown) => ({ type: "array", items });
const enumOf = (values: readonly string[]) => ({ type: "string", enum: [...values] });


const OUTPUT_SCHEMA = obj({
  title: str,
  titleKo: str,
  titleUz: str,
  keywords: arr(
    obj({ word: str, pronunciationKo: str, korean: str, uzbek: str, partOfSpeech: enumOf(KEYWORD_POS) }),
  ),
  puzzles: arr(
    obj({
      verbType: enumOf(VERB_TYPES),
      baseSentence: str,
      baseMeaningKo: str,
      baseMeaningUz: str,
      pronunciationKo: str,
      rows: arr(obj({ transform: enumOf(TRANSFORMS), prompt: str, answers: strArr, hintKo: str, hintUz: str })),
    }),
  ),
  storyQuestions: arr(
    obj({
      question: str,
      pronunciationKo: str,
      meaningKo: str,
      meaningUz: str,
      grammarType: enumOf(GRAMMAR_TYPES),
      exampleI: str,
      exampleShe: str,
      exampleHe: str,
    }),
  ),
  verbClassificationQuiz: arr(obj({ word: str, correctType: enumOf(VERB_TYPES), exampleSentence: str })),
  selfTransform: arr(
    obj({
      titleKo: str,
      titleUz: str,
      rows: arr(
        obj({
          labelKo: str,
          labelUz: str,
          promptKo: str,
          promptUz: str,
          answers: strArr,
          grammarType: enumOf(GRAMMAR_TYPES),
          given: { type: "boolean" },
        }),
      ),
    }),
  ),
  sentencePractice: arr(obj({ english: str, pronunciationKo: str, korean: str, uzbek: str })),
  freeTalk: arr(obj({ question: str, pronunciationKo: str, meaningKo: str, meaningUz: str })),
  warnings: arr(obj({ path: str, note: str })),
});

type Imported = {
  title: string;
  titleKo: string;
  titleUz: string;
  keywords: TextbookLessonSeed["keywords"];
  puzzles: (Omit<TextbookLessonSeed["puzzles"][number], "rows"> & {
    rows: Omit<TextbookLessonSeed["puzzles"][number]["rows"][number], "key">[];
  })[];
  storyQuestions: (Omit<TextbookLessonSeed["storyQuestions"][number], "key" | "examples"> & {
    exampleI: string;
    exampleShe: string;
    exampleHe: string;
  })[];
  verbClassificationQuiz: Omit<TextbookLessonSeed["verbClassificationQuiz"][number], "key">[];
  selfTransform: {
    titleKo: string;
    titleUz: string;
    rows: Omit<NonNullable<TextbookLessonSeed["selfTransform"]>[number]["rows"][number], "key">[];
  }[];
  sentencePractice: Omit<NonNullable<TextbookLessonSeed["sentencePractice"]>[number], "key">[];
  freeTalk: Omit<NonNullable<TextbookLessonSeed["freeTalk"]>[number], "key">[];
  warnings: ImportWarning[];
};

// Lesson 2 in the output format — a worked example of style and mapping.
function exampleOutput(): Imported {
  const l = lesson02;
  return {
    title: l.title,
    titleKo: l.titleKo,
    titleUz: l.titleUz,
    keywords: l.keywords,
    puzzles: l.puzzles.map((p) => ({ ...p, rows: p.rows.map(({ key: _k, ...r }) => r) })),
    storyQuestions: l.storyQuestions.map(({ key: _k, examples, ...q }) => ({
      ...q,
      exampleI: examples[1],
      exampleShe: examples[2],
      exampleHe: examples[3],
    })),
    verbClassificationQuiz: l.verbClassificationQuiz.map(({ key: _k, ...v }) => v),
    selfTransform: (l.selfTransform ?? []).map((b) => ({
      titleKo: b.titleKo,
      titleUz: b.titleUz,
      rows: b.rows.map(({ key: _k, ...r }) => ({ ...r, given: !!r.given })),
    })),
    sentencePractice: (l.sentencePractice ?? []).map(({ key: _k, ...s }) => s),
    freeTalk: (l.freeTalk ?? []).map(({ key: _k, ...f }) => f),
    warnings: [],
  };
}

const SYSTEM_PROMPT = `You convert photographed pages of the Pallo! English textbook (for Korean-speaking beginners) into structured lesson data for a learning app. The app shows Korean text from the book and its own Uzbek translation to learners.

A lesson (과) usually has these parts — map each to the output fields:
- Header "N과 <English title>" + Korean subtitle → title, titleKo; titleUz = natural Uzbek translation of the Korean subtitle.
- "0 오늘의 키워드 15": 5 nouns (명사), 5 verbs (동사), 5 adjectives (형용사), each English word + Korean pronunciation in parentheses + Korean meaning → keywords (word as printed, capitalised).
- 품사 guide boxes, "동사 한눈에 보기" verb chart and "변형 한눈에 보기" overview pages are identical in every lesson — skip them (the app already has them).
- "1 오늘의 퍼즐": one table per verb type (be동사 / 일반동사 / 조동사) with a 기본 문장 and fill-in rows → puzzles. Each row: transform (부정=negative, 의문=question, 의문사=wh_question, 주어=subject, 과거=past, 미래=future, 진행=continuous, 명령=imperative), prompt = the English line with the blank written as exactly "___", answers = the correct word(s) for the blank, hintKo = the "바뀌는 곳" text, hintUz = its Uzbek translation.
- "2 Our Story": 7 questions, each with Korean pronunciation, an orange grammar tag (기본 문장·be동사=be_verb, 기본 문장·일반동사=general_verb, 기본 문장·조동사=modal, 부정=negative, 과거=past, 미래=future, 진행=continuous), 뜻 (Korean meaning) and 예) example → storyQuestions. exampleI = the printed example; exampleShe/exampleHe = the same sentence correctly rewritten with She / He (agreement, her/his).
- "문장 변형 체크" checklist table — ignore (the app fills it automatically).
- "3 스스로 변형하기": blocks (① 현재·주어 I, ② 과거·주어 I, ③ 현재·주어 She, ④ 과거·주어 She, ⑤ 명령문 …) of rows with a label (기본문장, 부정하기, 물어보기, 의문사 물어보기, 목적어 바꾸기 → X, 동사 바꾸기 → X, 진행형, 조동사 will, 명령문, 부정 명령문) and a Korean sentence → selfTransform. answers = the correct English sentence(s) (add common contraction variants, e.g. "I don't drink water." and "I do not drink water."); given=true only for a row whose English is printed in the book (the worked example).
- "4 문장 연습": numbered English sentences with Korean pronunciation and Korean meaning → sentencePractice (uzbek = natural Uzbek translation).
- "프리토킹" questions → freeTalk.

Rules:
1. Puzzle answers come ONLY from the printed "진행자용 정답" line under each table, in order. The photos may contain a student's handwriting in the blanks or margins — ignore all handwriting completely.
2. Copy Korean and English text exactly as printed (keep punctuation). Do not invent content that is not in the photos; leave a section as an empty array if its page is missing.
3. Uzbek text: natural, correct Uzbek in Latin script (use ' for o' g'), written for a beginner, matching the style of the example.
4. verbClassificationQuiz: build 12 items from verbs used in this lesson's sentences — 4 be_verb, 4 general_verb, 4 modal_verb where possible — each with a short sentence from the lesson that uses the word.
5. warnings: list anything you were unsure about (blurry, cut off, ambiguous, page missing) with path like "keywords.3.korean" or "puzzles.1.rows.2.answers" and a short note in Uzbek. Empty if all is clear.

Output: a single JSON object (no code fences, no commentary) matching this JSON Schema exactly — every property present, empty arrays/strings for missing content:
${JSON.stringify(OUTPUT_SCHEMA)}

Here is lesson 2 of the same book in that format, as a reference for style and mapping:
${JSON.stringify(exampleOutput())}`;

export async function importLessonFromImages(
  images: ImportImage[],
  ctx: { level: number; lessonNumber: number },
): Promise<ImportResult> {
  if (!AI_API_KEY) {
    throw Object.assign(new Error("ENGLISH_AI_API_KEY is not configured"), { status: 503 });
  }
  const client = new Anthropic({ apiKey: AI_API_KEY });

  // Streaming because the structured lesson is a long output; finalMessage()
  // collects it. Server-side fallback is enabled so a safety-classifier
  // false positive on a textbook page doesn't fail the import.
  const stream = client.beta.messages.stream({
    model: MODEL,
    max_tokens: 64000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: {
      effort: "medium",
    },
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          ...images.map((img) => ({
            type: "image" as const,
            source: { type: "base64" as const, media_type: img.mediaType, data: img.data.toString("base64") },
          })),
          {
            type: "text" as const,
            text: `These ${images.length} photo(s) are the pages of Lv.${ctx.level} lesson ${ctx.lessonNumber}, in order. Convert them into the lesson data.`,
          },
        ],
      },
    ],
  } as Parameters<typeof client.beta.messages.stream>[0]);

  const message = await stream.finalMessage();
  if (message.stop_reason === "refusal") {
    throw Object.assign(new Error("The AI declined to process these images. Try clearer photos of the pages."), { status: 422 });
  }
  if (message.stop_reason === "max_tokens") {
    throw Object.assign(new Error("The lesson was too long for one import. Try fewer pages at once."), { status: 422 });
  }

  const text = message.content
    .filter((b): b is Extract<(typeof message.content)[number], { type: "text" }> => b.type === "text")
    .map((b) => b.text)
    .join("");
  let parsed: Imported;
  try {
    parsed = normalize(JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1)));
  } catch {
    throw Object.assign(new Error("The AI response could not be read. Please try again."), { status: 502 });
  }

  const usage = message.usage;
  const inputTokens =
    (usage.input_tokens ?? 0) + (usage.cache_creation_input_tokens ?? 0) + (usage.cache_read_input_tokens ?? 0);
  const outputTokens = usage.output_tokens ?? 0;

  const lesson: ImportResult["lesson"] = {
    title: parsed.title.trim(),
    titleKo: parsed.titleKo.trim(),
    titleUz: parsed.titleUz.trim(),
    partOfSpeechGuide: [],
    keywords: parsed.keywords,
    verbTypes: [],
    verbRuleKo: "",
    verbRuleUz: "",
    shapeTransforms: [],
    subjectTenseTransforms: [],
    imperative: { ruleKo: "", ruleUz: "", examples: [], dontRuleKo: "", dontRuleUz: "", dontExample: "" },
    puzzles: parsed.puzzles.map((p) => ({ ...p, rows: p.rows.map((r) => ({ ...r, key: "" })) })),
    storyQuestions: parsed.storyQuestions.map(({ exampleI, exampleShe, exampleHe, ...q }) => ({
      ...q,
      key: "",
      examples: { 1: exampleI, 2: exampleShe, 3: exampleHe },
    })),
    verbClassificationQuiz: parsed.verbClassificationQuiz.map((v) => ({ ...v, key: "" })),
    selfTransform: parsed.selfTransform.map((b) => ({ ...b, key: "", rows: b.rows.map((r) => ({ ...r, key: "" })) })),
    sentencePractice: parsed.sentencePractice.map((s) => ({ ...s, key: "" })),
    freeTalk: parsed.freeTalk.map((f) => ({ ...f, key: "" })),
  };

  return {
    lesson,
    warnings: parsed.warnings.filter((w) => w.note?.trim()),
    usage: {
      model: message.model,
      inputTokens,
      outputTokens,
      usd: Math.round(((inputTokens * PRICE_IN + outputTokens * PRICE_OUT) / 1_000_000) * 100) / 100,
    },
  };
}

// ─── Normalisation ─────────────────────────────────────────────────────────
// Coerces the model's JSON into the expected shape: missing strings/arrays
// become empty, unknown enum values fall back to a safe default and are
// reported as warnings for the admin to review.

type Json = Record<string, unknown>;
const S = (v: unknown) => (typeof v === "string" ? v.trim() : v == null ? "" : String(v).trim());
const A = (v: unknown): Json[] => (Array.isArray(v) ? v.filter((x) => x && typeof x === "object") : []) as Json[];
const SA = (v: unknown) => (Array.isArray(v) ? v.map(S).filter(Boolean) : []);

function normalize(raw: Json): Imported {
  const warnings: ImportWarning[] = A(raw.warnings).map((w) => ({ path: S(w.path), note: S(w.note) }));
  const pick = <T extends string>(allowed: readonly T[], v: unknown, fallback: T, path: string): T => {
    const s = S(v) as T;
    if (allowed.includes(s)) return s;
    warnings.push({ path, note: `Noma'lum qiymat "${s}" — "${fallback}" qo'yildi, tekshiring.` });
    return fallback;
  };
  return {
    title: S(raw.title),
    titleKo: S(raw.titleKo),
    titleUz: S(raw.titleUz),
    keywords: A(raw.keywords).map((k, i) => ({
      word: S(k.word),
      pronunciationKo: S(k.pronunciationKo),
      korean: S(k.korean),
      uzbek: S(k.uzbek),
      partOfSpeech: pick(KEYWORD_POS, k.partOfSpeech, "noun", `keywords.${i}.partOfSpeech`),
    })),
    puzzles: A(raw.puzzles).map((p, i) => ({
      verbType: pick(VERB_TYPES, p.verbType, "general_verb", `puzzles.${i}.verbType`),
      baseSentence: S(p.baseSentence),
      baseMeaningKo: S(p.baseMeaningKo),
      baseMeaningUz: S(p.baseMeaningUz),
      pronunciationKo: S(p.pronunciationKo),
      rows: A(p.rows).map((r, j) => ({
        transform: pick(TRANSFORMS, r.transform, "negative", `puzzles.${i}.rows.${j}.transform`),
        prompt: S(r.prompt),
        answers: SA(r.answers),
        hintKo: S(r.hintKo),
        hintUz: S(r.hintUz),
      })),
    })),
    storyQuestions: A(raw.storyQuestions).map((q, i) => ({
      question: S(q.question),
      pronunciationKo: S(q.pronunciationKo),
      meaningKo: S(q.meaningKo),
      meaningUz: S(q.meaningUz),
      grammarType: pick(GRAMMAR_TYPES, q.grammarType, "general_verb", `storyQuestions.${i}.grammarType`),
      exampleI: S(q.exampleI),
      exampleShe: S(q.exampleShe),
      exampleHe: S(q.exampleHe),
    })),
    verbClassificationQuiz: A(raw.verbClassificationQuiz).map((v, i) => ({
      word: S(v.word),
      correctType: pick(VERB_TYPES, v.correctType, "general_verb", `verbClassificationQuiz.${i}.correctType`),
      exampleSentence: S(v.exampleSentence),
    })),
    selfTransform: A(raw.selfTransform).map((b, i) => ({
      titleKo: S(b.titleKo),
      titleUz: S(b.titleUz),
      rows: A(b.rows).map((r, j) => ({
        labelKo: S(r.labelKo),
        labelUz: S(r.labelUz),
        promptKo: S(r.promptKo),
        promptUz: S(r.promptUz),
        answers: SA(r.answers),
        grammarType: pick(GRAMMAR_TYPES, r.grammarType, "general_verb", `selfTransform.${i}.rows.${j}.grammarType`),
        given: r.given === true,
      })),
    })),
    sentencePractice: A(raw.sentencePractice).map((x) => ({
      english: S(x.english),
      pronunciationKo: S(x.pronunciationKo),
      korean: S(x.korean),
      uzbek: S(x.uzbek),
    })),
    freeTalk: A(raw.freeTalk).map((f) => ({
      question: S(f.question),
      pronunciationKo: S(f.pronunciationKo),
      meaningKo: S(f.meaningKo),
      meaningUz: S(f.meaningUz),
    })),
    warnings,
  };
}
