import Anthropic from "@anthropic-ai/sdk";
import { AI_API_KEY } from "../config/env";
import { GRAMMAR_ROLES, GrammarRole, PARTS_OF_SPEECH, PartOfSpeech } from "../config/grammar";
import { IRREGULAR_VERB_CATEGORIES, IrregularVerbCategory } from "../config/irregularVerbs";

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
