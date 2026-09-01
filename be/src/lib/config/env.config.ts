import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.string().default("development"),
  PORT: z.coerce.number().default(3001),
  LLM_BASE_URL: z.string().url().default("http://localhost:11434/v1"),
  LLM_MODEL: z.string().default("qwen2.5:7b-instruct"),
  SESSION_SECRET: z.string().min(32),
  SESSION_COOKIE_NAME: z.string().default("smdl_session"),
  SESSION_TTL_HOURS: z.coerce.number().default(24),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  MAX_UPLOAD_BYTES: z.coerce.number().default(20 * 1024 * 1024),
  LER_SERVICE_URL: z.string().url().default("http://localhost:8000"),
  LER_TIMEOUT_MS: z.coerce.number().default(180_000),
  LER_MODEL_VARIANT: z
    .enum(["baseline", "layout", "layout_structure"])
    .default("layout"),
  KAFKA_BROKERS: z.string().default("localhost:9092"),
  KAFKA_CLIENT_ID: z.string().default("smdl-api"),
  KAFKA_TOPIC: z.string().default("app.events"),
  KAFKA_CONSUMER_GROUP: z.string().default("audit-storage"),
});

export const env = envSchema.parse(process.env);
