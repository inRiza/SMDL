"use client";

import { useCallback, useEffect, useState } from "react";
import {
  deleteTellsConversation,
  fetchTellsConversation,
  fetchTellsConversations,
} from "@/lib/api/tells/route";
import type { TellsConversationSummary, TellsMessage } from "@/types/tells.types";
import { TellsChat } from "./tells-chat";
import { TellsConversationSidebar } from "./tells-conversation-sidebar";

const WELCOME_MESSAGE: TellsMessage = {
  role: "assistant",
  content: "Halo! Saya TELLS. Tanyakan informasi dari dokumen legal",
};

export function TellsWorkspace() {
  const [conversations, setConversations] = useState<TellsConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [initialMessages, setInitialMessages] = useState<TellsMessage[]>([WELCOME_MESSAGE]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const refreshConversations = useCallback(async () => {
    const data = await fetchTellsConversations();
    setConversations(data);
  }, []);

  useEffect(() => {
    refreshConversations()
      .catch(() => setConversations([]))
      .finally(() => setLoadingHistory(false));
  }, [refreshConversations]);

  function startNewConversation() {
    setActiveConversationId(null);
    setInitialMessages([WELCOME_MESSAGE]);
  }

  async function openConversation(id: string) {
    if (id === activeConversationId) return;

    setLoadingConversation(true);
    setActiveConversationId(id);

    try {
      const detail = await fetchTellsConversation(id);
      setInitialMessages(
        detail.messages.map((message) => ({
          role: message.role,
          content: message.content,
          citations: message.citations,
        }))
      );
    } catch {
      setInitialMessages([
        {
          role: "assistant",
          content: "Gagal memuat percakapan. Coba pilih lagi atau mulai chat baru.",
        },
      ]);
    } finally {
      setLoadingConversation(false);
    }
  }

  async function handleDeleteConversation(id: string) {
    setDeletingId(id);

    try {
      await deleteTellsConversation(id);
      setConversations((prev) => prev.filter((item) => item.id !== id));

      if (activeConversationId === id) {
        startNewConversation();
      }
    } catch {
      // keep list unchanged on failure
    } finally {
      setDeletingId(null);
    }
  }

  async function handleConversationCreated(id: string, title: string) {
    setActiveConversationId(id);
    await refreshConversations();
    setConversations((prev) => {
      if (prev.some((item) => item.id === id)) return prev;
      return [
        {
          id,
          title,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        ...prev,
      ];
    });
  }

  async function handleNewConversationPersisted() {
    await refreshConversations();
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
      <TellsConversationSidebar
        conversations={conversations}
        activeId={activeConversationId}
        loading={loadingHistory}
        deletingId={deletingId}
        onSelect={openConversation}
        onNew={startNewConversation}
        onDelete={handleDeleteConversation}
      />

      <TellsChat
        key={activeConversationId ?? "new"}
        conversationId={activeConversationId}
        initialMessages={initialMessages}
        loadingConversation={loadingConversation}
        onConversationCreated={handleConversationCreated}
        onConversationUpdated={handleNewConversationPersisted}
      />
    </div>
  );
}
