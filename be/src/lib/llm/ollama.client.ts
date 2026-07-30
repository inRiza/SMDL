import { env } from "@/lib/config/env.config";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type OllamaChatResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

const LLM_TIMEOUT_MS = 90_000;

export async function chatWithOllama(messages: ChatMessage[], options?: { temperature?: number }): Promise<string> {
  const res = await fetch(`${env.LLM_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(LLM_TIMEOUT_MS),
    body: JSON.stringify({
      model: env.LLM_MODEL,
      messages,
      temperature: options?.temperature ?? 0.3,
    }),
  });

  if (!res.ok) {
    throw new Error(`LLM request failed: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as OllamaChatResponse;
  const content = data.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new Error("LLM returned empty response");
  }

  return content;
}
