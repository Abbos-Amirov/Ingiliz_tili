import Anthropic from "@anthropic-ai/sdk";
import { env } from "../config/env";

export interface TranslationSuggestion {
  korean: string;
  exampleSentenceEn: string;
  exampleSentenceKo: string;
}

const MODEL = "claude-haiku-4-5-20251001";

const SUGGEST_TOOL = {
  name: "suggest_translation",
  description: "Provide a Korean translation and example sentence pair for an English word.",
  input_schema: {
    type: "object" as const,
    properties: {
      korean: { type: "string", description: "Korean translation of the English word" },
      exampleSentenceEn: { type: "string", description: "Short example sentence in English using the word" },
      exampleSentenceKo: { type: "string", description: "Korean translation of that example sentence" },
    },
    required: ["korean", "exampleSentenceEn", "exampleSentenceKo"],
  },
};

export async function suggestTranslation(english: string): Promise<TranslationSuggestion> {
  if (!env.ANTHROPIC_API_KEY) {
    throw Object.assign(new Error("ANTHROPIC_API_KEY is not configured"), { status: 503 });
  }

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 512,
    tools: [SUGGEST_TOOL],
    tool_choice: { type: "tool", name: "suggest_translation" },
    messages: [
      {
        role: "user",
        content: `Translate the English word "${english}" into Korean for a Uzbek learner studying English via Korean. Provide a natural Korean translation and a short, simple example sentence (beginner-friendly) in both English and Korean. Call the suggest_translation tool with your answer.`,
      },
    ],
  });

  const toolUse = response.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("AI did not return a structured suggestion");
  }

  return toolUse.input as TranslationSuggestion;
}
