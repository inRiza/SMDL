import type {
  TellsChatResponse,
  TellsConversationDetail,
  TellsConversationSummary,
  TellsMessage,
} from "@/types/tells.types";
import { getApiBeTells } from "../api.be";

const fetchOpts: RequestInit = {
  credentials: "include",
};

export async function sendTellsMessage(
  message: string,
  history: TellsMessage[] = [],
  conversationId?: string
): Promise<TellsChatResponse> {
  const res = await fetch(`${getApiBeTells()}/chat`, {
    ...fetchOpts,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history, conversationId }),
  });

  if (!res.ok) {
    throw new Error(`TELLS request failed: ${res.statusText}`);
  }

  return res.json();
}

export async function fetchTellsConversations(): Promise<TellsConversationSummary[]> {
  const res = await fetch(`${getApiBeTells()}/conversations`, {
    ...fetchOpts,
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch conversations: ${res.statusText}`);
  }

  const json = (await res.json()) as { data: TellsConversationSummary[] };
  return json.data;
}

export async function fetchTellsConversation(
  id: string
): Promise<TellsConversationDetail> {
  const res = await fetch(`${getApiBeTells()}/conversations/${id}`, {
    ...fetchOpts,
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch conversation: ${res.statusText}`);
  }

  return res.json();
}

export async function createTellsConversation(): Promise<TellsConversationDetail> {
  const res = await fetch(`${getApiBeTells()}/conversations`, {
    ...fetchOpts,
    method: "POST",
  });

  if (!res.ok) {
    throw new Error(`Failed to create conversation: ${res.statusText}`);
  }

  return res.json();
}

export async function deleteTellsConversation(id: string): Promise<void> {
  const res = await fetch(`${getApiBeTells()}/conversations/${id}`, {
    ...fetchOpts,
    method: "DELETE",
  });

  if (!res.ok) {
    throw new Error(`Failed to delete conversation: ${res.statusText}`);
  }
}
