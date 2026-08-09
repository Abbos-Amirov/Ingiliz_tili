import Anthropic from "@anthropic-ai/sdk";
import { AI_API_KEY } from "../config/env";
import { GRAMMAR_ROLES, GrammarRole, PARTS_OF_SPEECH, PartOfSpeech } from "../config/grammar";
import { IRREGULAR_VERB_CATEGORIES, IrregularVerbCategory } from "../config/irregularVerbs";
import { FUNCTION_WORD_CATEGORIES, FunctionWordCategory } from "../config/functionWords";

export interface TranslationSuggestion {
  korean: string;
  exampleSentenceEn: string;
  exampleSentenceKo: string;
  partOfSpeech: PartOfSpeech;
}

export interface RoleWordSuggestion {
  text: string;
  role: GrammarRole;
}

export interface SentenceRolesSuggestion {
  words: RoleWordSuggestion[];
  distractorWords: RoleWordSuggestion[];
  formula: string;
}

const MODEL = "claude-haiku-4-5-20251001";

function requireClient(): Anthropic {
  if (!AI_API_KEY) {
    throw Object.assign(new Error("ENGLISH_AI_API_KEY is not configured"), { status: 503 });
  }
  return new Anthropic({ apiKey: AI_API_KEY });
}

function extractToolInput<T>(response: Anthropic.Message): T {
  const toolUse = response.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("AI did not return a structured suggestion");
  }
  return toolUse.input as T;
}

const SUGGEST_TRANSLATION_TOOL = {
  name: "suggest_translation",
  description: "Provide a Korean translation, example sentence pair, and part of speech for an English word.",
  input_schema: {
    type: "object" as const,
    properties: {
      korean: { type: "string", description: "Korean translation of the English word" },
      exampleSentenceEn: { type: "string", description: "Short example sentence in English using the word" },
      exampleSentenceKo: { type: "string", description: "Korean translation of that example sentence" },
      partOfSpeech: { type: "string", enum: PARTS_OF_SPEECH as unknown as string[], description: "The word's dictionary part of speech" },
    },
    required: ["korean", "exampleSentenceEn", "exampleSentenceKo", "partOfSpeech"],
  },
};

export async function suggestTranslation(english: string): Promise<TranslationSuggestion> {
  const client = requireClient();

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 512,
    tools: [SUGGEST_TRANSLATION_TOOL],
    tool_choice: { type: "tool", name: "suggest_translation" },
    messages: [
      {
        role: "user",
        content: `Translate the English word "${english}" into Korean for a Uzbek learner studying English via Korean. Provide a natural Korean translation, a short simple example sentence (beginner-friendly) in both English and Korean, and the word's part of speech. Call the suggest_translation tool with your answer.`,
      },
    ],
  });

  return extractToolInput<TranslationSuggestion>(response);
}

export interface IrregularVerbSuggestion {
  past: string;
  participle: string;
  korean: string;
  category: IrregularVerbCategory;
}

const SUGGEST_IRREGULAR_VERB_TOOL = {
  name: "suggest_irregular_verb",
  description: "Provide the past tense and past participle forms, Korean translation, and semantic category for an English irregular verb's base form.",
  input_schema: {
    type: "object" as const,
    properties: {
      past: { type: "string", description: "The simple past tense form (V2), lowercase, e.g. 'drank'" },
      participle: { type: "string", description: "The past participle form (V3), lowercase, e.g. 'drunk'" },
      korean: { type: "string", description: "Korean translation of the base (dictionary) form of the verb" },
      category: {
        type: "string",
        enum: IRREGULAR_VERB_CATEGORIES as unknown as string[],
        description: "Semantic grouping of the verb's meaning",
      },
    },
    required: ["past", "participle", "korean", "category"],
  },
};

export async function suggestIrregularVerb(base: string): Promise<IrregularVerbSuggestion> {
  const client = requireClient();

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 512,
    tools: [SUGGEST_IRREGULAR_VERB_TOOL],
    tool_choice: { type: "tool", name: "suggest_irregular_verb" },
    messages: [
      {
        role: "user",
        content: `The English irregular verb's base form (V1) is "${base}". Provide its simple past tense (V2), past participle (V3), a Korean translation of the base form, and a semantic category from: ${IRREGULAR_VERB_CATEGORIES.join(", ")}. Call the suggest_irregular_verb tool with your answer.`,
      },
    ],
  });

  return extractToolInput<IrregularVerbSuggestion>(response);
}

const roleWordSchema = {
  type: "object" as const,
  properties: {
    text: { type: "string" as const },
    role: { type: "string" as const, enum: GRAMMAR_ROLES as unknown as string[] },
  },
  required: ["text", "role"],
};

const SUGGEST_ROLES_TOOL = {
  name: "suggest_sentence_roles",
  description:
    "Split an English sentence into its words in order, tag each with its grammatical role, suggest 1-2 plausible wrong-form distractor words with roles, and identify the grammar formula.",
  input_schema: {
    type: "object" as const,
    properties: {
      words: {
        type: "array" as const,
        items: roleWordSchema,
        description: "The correct sentence's words in order, each tagged with its grammatical role",
      },
      distractorWords: {
        type: "array" as const,
        items: roleWordSchema,
        description: "1-2 wrong-form distractor words (e.g. wrong tense/conjugation) with roles",
      },
      formula: {
        type: "string" as const,
        description: "Grammar pattern using S, V, O, Adj, be, V-ing, V3, modal, Wh- joined with '+', e.g. S+be+V-ing+O",
      },
    },
    required: ["words", "distractorWords", "formula"],
  },
};

export async function suggestSentenceRoles(
  englishSentence: string,
  koreanSentence: string,
): Promise<SentenceRolesSuggestion> {
  const client = requireClient();

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    tools: [SUGGEST_ROLES_TOOL],
    tool_choice: { type: "tool", name: "suggest_sentence_roles" },
    messages: [
      {
        role: "user",
        content: `English sentence: "${englishSentence}"\nKorean translation: "${koreanSentence}"\n\nSplit the English sentence into its individual words in order, and tag each word with its grammatical ROLE in this sentence using only these values: ${GRAMMAR_ROLES.join(", ")}. Also suggest 1-2 plausible wrong-form distractor words (e.g. wrong verb tense or conjugation of one of the sentence's verbs) with their role. Finally, identify the grammar formula pattern (e.g. "S+be+V-ing+O" for present continuous, "S+V+O" for simple present). Call the suggest_sentence_roles tool with your answer.`,
      },
    ],
  });

  return extractToolInput<SentenceRolesSuggestion>(response);
}

export interface GrammarTopicSuggestion {
  titleTranslations: { en: string; ko: string };
  ruleExplanation: { uz: string; en: string; ko: string };
  usageCases: { uz: string; example: string }[];
  commonMistakes: { wrong: string; correct: string; explanation: string }[];
  examples: { english: string; korean: string; uzbek: string }[];
}

const SUGGEST_GRAMMAR_TOOL = {
  name: "suggest_grammar_topic",
  description:
    "Generate teaching material for an English grammar topic: a trilingual rule explanation, usage cases, common learner mistakes, and example sentences.",
  input_schema: {
    type: "object" as const,
    properties: {
      titleTranslations: {
        type: "object" as const,
        properties: {
          en: { type: "string", description: "The grammar topic's name in English (standard ESL terminology)" },
          ko: { type: "string", description: "The grammar topic's name in Korean (standard terminology)" },
        },
        required: ["en", "ko"],
        description: "Translation of the topic's title (given in Uzbek) into English and Korean",
      },
      ruleExplanation: {
        type: "object" as const,
        properties: {
          uz: { type: "string", description: "Rule explanation in Uzbek, 2-3 sentences" },
          en: { type: "string", description: "Rule explanation in English, 2-3 sentences" },
          ko: { type: "string", description: "Rule explanation in Korean, 2-3 sentences" },
        },
        required: ["uz", "en", "ko"],
      },
      usageCases: {
        type: "array" as const,
        items: {
          type: "object" as const,
          properties: {
            uz: { type: "string", description: "Short description (Uzbek) of when this pattern is used" },
            example: { type: "string", description: "Short English example sentence demonstrating that usage" },
          },
          required: ["uz", "example"],
        },
        description: "Exactly 3 distinct usage cases for this grammar topic",
      },
      commonMistakes: {
        type: "array" as const,
        items: {
          type: "object" as const,
          properties: {
            wrong: { type: "string", description: "An incorrect sentence learners commonly write" },
            correct: { type: "string", description: "The corrected version of that sentence" },
            explanation: { type: "string", description: "Short explanation (Uzbek) of the mistake" },
          },
          required: ["wrong", "correct", "explanation"],
        },
        description: "Exactly 2 common learner mistakes with this grammar topic",
      },
      examples: {
        type: "array" as const,
        items: {
          type: "object" as const,
          properties: {
            english: { type: "string" },
            korean: { type: "string", description: "Natural Korean translation" },
            uzbek: { type: "string", description: "Natural Uzbek translation" },
          },
          required: ["english", "korean", "uzbek"],
        },
        description: "Exactly 4 example sentences using this grammar pattern",
      },
    },
    required: ["titleTranslations", "ruleExplanation", "usageCases", "commonMistakes", "examples"],
  },
};

export async function generateGrammarTopicContent(
  title: string,
  formula: string,
  level: string,
): Promise<GrammarTopicSuggestion> {
  const client = requireClient();

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1800,
    tools: [SUGGEST_GRAMMAR_TOOL],
    tool_choice: { type: "tool", name: "suggest_grammar_topic" },
    messages: [
      {
        role: "user",
        content: `Create English-grammar teaching material for an Uzbek learner studying English via Korean.\nTopic (Uzbek): "${title}"\nGrammar formula: "${formula}"\nLevel: ${level}\n\nProvide: the topic's title translated into English and Korean (standard ESL/grammar terminology, not a literal word-for-word translation); a rule explanation in Uzbek, English, and Korean (2-3 clear, learner-friendly sentences each); exactly 3 usage cases (each a short Uzbek description plus a short English example sentence); exactly 2 common learner mistakes (wrong sentence, corrected sentence, short Uzbek explanation); and exactly 4 example sentences (English, with natural Korean and Uzbek translations). Call the suggest_grammar_topic tool with your answer.`,
      },
    ],
  });

  return extractToolInput<GrammarTopicSuggestion>(response);
}

export interface RoleWordInput {
  text: string;
  role: GrammarRole;
}

// UI-facing prose that follows the app's language switcher (uz/en/ko) — see
// translations.ts's Locale type. Example sentences stay plain English
// strings elsewhere (they're content, not UI chrome).
export interface Trilingual {
  uz: string;
  en: string;
  ko: string;
}

const TRILINGUAL_SCHEMA = {
  type: "object" as const,
  properties: {
    uz: { type: "string" as const, description: "Uzbek" },
    en: { type: "string" as const, description: "English" },
    ko: { type: "string" as const, description: "Korean" },
  },
  required: ["uz", "en", "ko"],
};

export interface SentenceWordExplanation {
  text: string;
  role: GrammarRole;
  simpleExplanation: Trilingual;
  moreExamples: string[];
  functionWordRef: string | null;
  specialNote: Trilingual | null;
}

export interface SentenceExplanationSuggestion {
  wordBreakdown: SentenceWordExplanation[];
  generalRule: Trilingual;
  practiceExamples: string[];
}

// Small, closed set — the AI is only asked to flag a word as a "function
// word" when it recognizes it as one of these (predloglar/artikllar/so'roq
// so'zlari), so functionWordRef only ever points at glossary entries that
// are meant to exist (see FunctionWord seed list).
const KNOWN_FUNCTION_WORDS = [
  "to", "in", "on", "at", "by", "for", "with", "from", "of", "about",
  "a", "an", "the",
  "what", "who", "where", "when", "why", "how", "which",
];
const KNOWN_FUNCTION_WORD_SET = new Set(KNOWN_FUNCTION_WORDS);

const SUGGEST_EXPLANATION_TOOL = {
  name: "suggest_sentence_explanation",
  description:
    "Break an English sentence down into a child-friendly, word-by-word explanation for a beginner Uzbek learner studying via Korean.",
  input_schema: {
    type: "object" as const,
    properties: {
      wordBreakdown: {
        type: "array" as const,
        items: {
          type: "object" as const,
          properties: {
            simpleExplanation: {
              ...TRILINGUAL_SCHEMA,
              description:
                "1-2 short, simple sentences explaining this word's job in THIS sentence, written for a child — provided in Uzbek, English, AND Korean",
            },
            moreExamples: {
              type: "array" as const,
              items: { type: "string" as const },
              description: "0-2 short additional English example sentences using this word in the same role (omit for short function words like articles)",
            },
            functionWordRef: {
              type: "string" as const,
              enum: [...KNOWN_FUNCTION_WORDS, ""],
              description: `If this word is one of these common function words: ${KNOWN_FUNCTION_WORDS.join(", ")} — its lowercase form, so the app can link to the shared glossary entry. Otherwise an empty string.`,
            },
            specialNote: {
              ...TRILINGUAL_SCHEMA,
              description:
                "An important, easy-to-miss callout about this word's placement or behavior in THIS sentence (e.g. in a question, the auxiliary comes BEFORE the subject — unlike a statement). Leave all three languages as empty strings when there's nothing special to flag for this word.",
            },
          },
          required: ["simpleExplanation", "moreExamples", "functionWordRef", "specialNote"],
        },
        description: "Exactly one entry per word, in the exact same order as the sentence's word list given below",
      },
      generalRule: {
        ...TRILINGUAL_SCHEMA,
        description: "One short sentence stating the general rule this sentence's grammar pattern teaches — in Uzbek, English, AND Korean",
      },
      practiceExamples: {
        type: "array" as const,
        items: { type: "string" as const },
        description: "Exactly 3 short independent English practice sentences using the same grammar pattern",
      },
    },
    required: ["wordBreakdown", "generalRule", "practiceExamples"],
  },
};

interface RawExplanationSuggestion {
  wordBreakdown: {
    simpleExplanation: Trilingual;
    moreExamples: string[];
    functionWordRef: string;
    specialNote: Trilingual;
  }[];
  generalRule: Trilingual;
  practiceExamples: string[];
}

function isBlankTrilingual(t: Trilingual): boolean {
  return !t.uz.trim() && !t.en.trim() && !t.ko.trim();
}

export async function generateSentenceExplanation(
  koreanSentence: string,
  words: RoleWordInput[],
  formula: string,
  sentenceType: "statement" | "question" | "answer" = "statement",
): Promise<SentenceExplanationSuggestion> {
  const client = requireClient();

  const wordList = words.map((w, i) => `${i + 1}. "${w.text}" (role: ${w.role})`).join("\n");
  const questionGuidance =
    sentenceType === "question"
      ? `\n\nThis sentence is a QUESTION. Pay special attention to: the auxiliary verb (do/does/did/is/are/can/...) — flag in its specialNote that it comes BEFORE the subject here, unlike in a statement; and the Wh- question word (if any) — explain what it's asking about (place, time, reason, ...) in its simpleExplanation.`
      : sentenceType === "answer"
        ? `\n\nThis sentence is the ANSWER to a question — keep explanations focused on this sentence's own structure.`
        : "";

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4500,
    tools: [SUGGEST_EXPLANATION_TOOL],
    tool_choice: { type: "tool", name: "suggest_sentence_explanation" },
    messages: [
      {
        role: "user",
        content: `English sentence: "${words.map((w) => w.text).join(" ")}"\nKorean translation: "${koreanSentence}"\nGrammar formula: "${formula}"\n\nThe sentence's words, in order, each already tagged with its grammatical role:\n${wordList}${questionGuidance}\n\nFor a young beginner learning English who speaks Uzbek and knows Korean, explain what each word's job is in THIS sentence — simple, warm, 1-2 sentences each. Provide every explanation in THREE languages (Uzbek, English, and Korean) so it can be shown in whichever language the learner's app is set to. Add a specialNote only for a word whose placement or behavior is easy to miss — leave it blank (empty strings) for ordinary words. Then give one short general rule for the grammar pattern (also in all three languages), and 3 practice example sentences (English only). Call the suggest_sentence_explanation tool with your answer.`,
      },
    ],
  });

  const raw = extractToolInput<RawExplanationSuggestion>(response);
  if (raw.wordBreakdown.length !== words.length) {
    throw new Error("AI returned a wordBreakdown that doesn't match the sentence's word count");
  }

  return {
    wordBreakdown: raw.wordBreakdown.map((item, i) => ({
      text: words[i].text,
      role: words[i].role,
      simpleExplanation: item.simpleExplanation,
      moreExamples: item.moreExamples ?? [],
      // Belt-and-suspenders: the tool schema already constrains this to
      // KNOWN_FUNCTION_WORDS via enum, but models don't always honor enums
      // strictly — re-validate so a hallucinated ref never becomes a dead
      // link in the UI (no matching FunctionWord glossary entry to open).
      functionWordRef:
        item.functionWordRef && KNOWN_FUNCTION_WORD_SET.has(item.functionWordRef.toLowerCase())
          ? item.functionWordRef.toLowerCase()
          : null,
      specialNote: item.specialNote && !isBlankTrilingual(item.specialNote) ? item.specialNote : null,
    })),
    generalRule: raw.generalRule,
    practiceExamples: raw.practiceExamples,
  };
}

export interface FunctionWordUsageType {
  meaning: Trilingual;
  example: string;
  note: Trilingual;
}

export interface FunctionWordMistake {
  wrong: string;
  correct: string;
  explanation: Trilingual;
}

export interface FunctionWordSuggestion {
  simpleExplanation: Trilingual;
  usageTypes: FunctionWordUsageType[];
  commonMistakes: FunctionWordMistake[];
}

const SUGGEST_FUNCTION_WORD_TOOL = {
  name: "suggest_function_word",
  description:
    "Explain an English function word (preposition, article, or question word) for a beginner learner who speaks Uzbek and knows Korean.",
  input_schema: {
    type: "object" as const,
    properties: {
      simpleExplanation: {
        ...TRILINGUAL_SCHEMA,
        description: "1-2 simple sentences giving a general, easy-to-remember sense of the word — in Uzbek, English, AND Korean",
      },
      usageTypes: {
        type: "array" as const,
        items: {
          type: "object" as const,
          properties: {
            meaning: { ...TRILINGUAL_SCHEMA, description: "Short description of this specific meaning/use — in Uzbek, English, AND Korean" },
            example: { type: "string" as const, description: "Short English example sentence demonstrating it" },
            note: { ...TRILINGUAL_SCHEMA, description: "Short clarifying note — in Uzbek, English, AND Korean" },
          },
          required: ["meaning", "example", "note"],
        },
        description: "2-4 distinct common uses/meanings of this word",
      },
      commonMistakes: {
        type: "array" as const,
        items: {
          type: "object" as const,
          properties: {
            wrong: { type: "string" as const, description: "An incorrect sentence learners commonly write with this word" },
            correct: { type: "string" as const, description: "The corrected version" },
            explanation: { ...TRILINGUAL_SCHEMA, description: "Short explanation of the mistake — in Uzbek, English, AND Korean" },
          },
          required: ["wrong", "correct", "explanation"],
        },
        description: "1-2 common learner mistakes with this word",
      },
    },
    required: ["simpleExplanation", "usageTypes", "commonMistakes"],
  },
};

export async function generateFunctionWordContent(
  word: string,
  category: FunctionWordCategory,
): Promise<FunctionWordSuggestion> {
  const client = requireClient();

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2200,
    tools: [SUGGEST_FUNCTION_WORD_TOOL],
    tool_choice: { type: "tool", name: "suggest_function_word" },
    messages: [
      {
        role: "user",
        content: `Explain the English ${category.replace("_", " ")} "${word}" for a beginner learner who speaks Uzbek and knows Korean. Category options for context: ${FUNCTION_WORD_CATEGORIES.join(", ")}. Provide every explanation/meaning/note field in THREE languages (Uzbek, English, and Korean) so it can be shown in whichever language the learner's app is set to; keep example sentences in English only. Call the suggest_function_word tool with your answer.`,
      },
    ],
  });

  return extractToolInput<FunctionWordSuggestion>(response);
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface SentenceChatContext {
  korean: string;
  englishWords: string[];
  formula: string;
}

const LOCALE_NAMES: Record<string, string> = { uz: "Uzbek", en: "English", ko: "Korean" };

export async function chatAboutSentence(
  message: string,
  context: SentenceChatContext,
  history: ChatMessage[],
  locale: string,
): Promise<string> {
  const client = requireClient();
  const localeName = LOCALE_NAMES[locale] ?? "Uzbek";

  const systemPrompt = `You are a friendly, encouraging English grammar tutor inside a language-learning app. The student is an Uzbek speaker learning English via Korean. They are currently working on this sentence-building exercise:

Korean sentence: "${context.korean}"
Correct English sentence: "${context.englishWords.join(" ")}"
Grammar formula: "${context.formula}"

Answer the student's questions about this sentence, English grammar in general, or vocabulary. Keep answers SHORT (2-4 sentences), clear, warm, and encouraging — this is a chat widget, not an essay. Respond in ${localeName} unless the student writes in a different language, in which case follow their language. Do not give away answers to unrelated exercises; focus on explaining grammar and vocabulary concepts. Write in PLAIN TEXT only — no markdown formatting (no **bold**, no _italics_, no bullet lists, no headings). You may use a single emoji occasionally if it fits naturally.`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 500,
    system: systemPrompt,
    messages: [...history.map((h) => ({ role: h.role, content: h.content })), { role: "user" as const, content: message }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("AI did not return a text reply");
  }
  return textBlock.text;
}
