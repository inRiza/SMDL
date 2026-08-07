"use client";

import { useCallback, useEffect, useState } from "react";
import {
  deleteTellsConversation,
  fetchTellsConversation,
  fetchTellsConversations,
} from "@/lib/api/tells/route";
import type { TellsConversationSummary, TellsMessage } from "@/types/tells.types";
import { cn } from "@/lib/utils";
import { TellsChat } from "./tells-chat";
import { TellsConversationSidebar } from "./tells-conversation-sidebar";

export function TellsWorkspace() {
  const [conversations, setConversations] = useState<TellsConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [initialMessages, setInitialMessages] = useState<TellsMessage[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(true);

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
    setInitialMessages([]);
  }

  async function openConversation(id: string) {
    if (id === activeConversationId) return;

    setLoadingConversation(true);
    setActiveConversationId(id);
    setInitialMessages([]);

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
    <div className="relative h-full min-h-0 w-full flex-1 overflow-hidden bg-telkom-grey-100">
      <div
        className={cn(
          "absolute inset-0 overflow-hidden",
          historyOpen
            ? "grid grid-rows-[11rem_minmax(0,1fr)] md:grid-cols-[18rem_minmax(0,1fr)] md:grid-rows-none"
            : "grid grid-rows-1 md:grid-cols-1"
        )}
      >
        {historyOpen && (
          <TellsConversationSidebar
            open={historyOpen}
            onToggle={() => setHistoryOpen((prev) => !prev)}
            conversations={conversations}
            activeId={activeConversationId}
            loading={loadingHistory}
            deletingId={deletingId}
            onSelect={openConversation}
            onNew={startNewConversation}
            onDelete={handleDeleteConversation}
          />
        )}

        <div className="flex min-h-0 min-w-0 flex-col overflow-hidden bg-white md:m-2 md:ml-0 md:rounded-xl">
          <TellsChat
            conversationId={activeConversationId}
            initialMessages={initialMessages}
            loadingConversation={loadingConversation}
            historyOpen={historyOpen}
            onToggleHistory={() => setHistoryOpen((prev) => !prev)}
            onConversationCreated={handleConversationCreated}
            onConversationUpdated={handleNewConversationPersisted}
          />
        </div>
      </div>
    </div>
  );
}
