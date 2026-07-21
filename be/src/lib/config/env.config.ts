import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.string().default("development"),
  PORT: z.coerce.number().default(3001),
  LLM_BASE_URL: z.string().url().default("http://localhost:11434/v1"),
  LLM_MODEL: z.string().default("qwen2.5:7b-instruct"),
  SESSION_SECRET: z.string().min(32),
  SESSION_COOKIE_NAME: z.string().default("smdl_session"),
  SESSION_TTL_HOURS: z.coerce.number().default(24),
});

export const env = envSchema.parse(process.env);
