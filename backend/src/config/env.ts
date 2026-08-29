import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.string().default("4000"),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  ANTHROPIC_API_KEY: z.string().optional().default(""),
  ENGLISH_AI_API_KEY: z.string().optional().default(""),
  UNSPLASH_ACCESS_KEY: z.string().optional().default(""),
  OPENAI_API_KEY: z.string().optional().default(""),
  GOOGLE_CLIENT_ID: z.string().optional().default(""),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  // This server's own publicly-reachable origin — used to build absolute
  // audioUrl values for auto-generated pronunciation clips (see
  // tts.service.ts), since those are served by this backend itself rather
  // than bundled into the frontend's static assets like the older,
  // manually-run scripts/generateAudio.ts clips are.
  PUBLIC_BASE_URL: z.string().default("http://localhost:5051"),
  NODE_ENV: z.string().default("development"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

// ENGLISH_AI_API_KEY is the primary key going forward; ANTHROPIC_API_KEY is
// kept as a fallback for backward compatibility with earlier setup.
export const AI_API_KEY = env.ENGLISH_AI_API_KEY || env.ANTHROPIC_API_KEY;

export const UNSPLASH_ACCESS_KEY = env.UNSPLASH_ACCESS_KEY;

export const OPENAI_API_KEY = env.OPENAI_API_KEY;

export const PUBLIC_BASE_URL = env.PUBLIC_BASE_URL;

// Only the client ID is needed — Google Identity Services issues a signed ID
// token client-side that we verify server-side (see googleAuth.service.ts),
// which never requires GOOGLE_CLIENT_SECRET (that's only for the
// authorization-code flow, which this app doesn't use).
export const GOOGLE_CLIENT_ID = env.GOOGLE_CLIENT_ID;
