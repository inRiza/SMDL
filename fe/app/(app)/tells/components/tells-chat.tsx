"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Bot, ExternalLink, FileText, Send } from "lucide-react";
import { SearchLoadingIndicator } from "@/components/app/search-loading-indicator";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { Button } from "@/components/ui/button";
import { fetchMe } from "@/lib/api/auth/route";
import { sendTellsMessage } from "@/lib/api/tells/route";
import type { TellsCitation, TellsMessage } from "@/types/tells.types";
import { cn } from "@/lib/utils";
import { TellsHistoryToggle } from "./tells-conversation-sidebar";

type TellsChatProps = {
  conversationId?: string | null;
  initialMessages: TellsMessage[];
  loadingConversation?: boolean;
  historyOpen?: boolean;
  onToggleHistory?: () => void;
  onConversationCreated?: (id: string, title: string) => void;
  onConversationUpdated?: () => void;
};

function getDisplayName(userName: string) {
  if (userName.includes("@")) {
    return userName.split("@")[0] ?? userName;
  }
  return userName.split(" ")[0] ?? userName;
}

function formatFileSize(bytes: string) {
  const size = Number(bytes);
  if (!Number.isFinite(size)) return bytes;
  if (size >= 1_000_000) return `${(size / 1_000_000).toFixed(1)} MB`;
  if (size >= 1_000) return `${(size / 1_000).toFixed(1)} KB`;
  return `${size} B`;
}

function renderReplyWithMarkers(content: string) {
  const parts = content.split(/(\[\d{1,2}\])/g);

  return parts.map((part, index) => {
    const marker = part.match(/^\[(\d{1,2})\]$/);
    if (!marker) {
      return <span key={`text-${index}`}>{part}</span>;
    }

    return (
      <sup
        key={`ref-${index}`}
        className="mx-0.5 inline-flex size-4 items-center justify-center rounded-full bg-telkom-red/10 text-[10px] font-semibold text-telkom-red"
      >
        {marker[1]}
      </sup>
    );
  });
}

function ReferenceCard({ citation }: { citation: TellsCitation }) {
  return (
    <Link
      href={`/documents/${citation.documentId}`}
      className="group block rounded-lg bg-telkom-grey-50 p-3 transition-colors hover:bg-telkom-grey-100"
    >
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-telkom-red/10 text-[11px] font-semibold text-telkom-red">
          {citation.refIndex ?? "·"}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="line-clamp-1 text-sm font-medium text-telkom-grey-900 group-hover:text-telkom-red">
              {citation.title}
            </p>
            <ExternalLink className="size-3.5 shrink-0 text-telkom-grey-400 opacity-0 transition-opacity group-hover:opacity-100" />
          </div>

          <p className="mt-0.5 text-xs text-telkom-grey-500">
            {[
              citation.category,
              citation.fileFormat.toUpperCase(),
              formatFileSize(citation.fileSizeBytes),
              `${Math.round(citation.score * 100)}% relevan`,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>

          {citation.snippet && (
            <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-telkom-grey-600">
              “{citation.snippet}”
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

function ChatAvatar({
  role,
  userName,
}: {
  role: "user" | "assistant";
  userName: string;
}) {
  if (role === "assistant") {
    return (
      <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-telkom-red/10 text-telkom-red">
        <Bot className="size-3.5" />
      </div>
    );
  }

  return <InitialsAvatar name={userName} kind="user" size="sm" />;
}

function TellsWelcomeHero({ userName }: { userName: string }) {
  const displayName = getDisplayName(userName);

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 text-center">
      <div className="flex size-11 items-center justify-center rounded-full bg-telkom-red/10 text-telkom-red">
        <Bot className="size-5" />
      </div>

      <h2 className="mt-5 text-xl font-semibold text-telkom-grey-900">
        Halo, {displayName}!
      </h2>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-telkom-grey-500">
        Tanyakan informasi dari dokumen legal perusahaan. TELLS siap membantu
        mencari jawaban dari basis dokumen.
      </p>
    </div>
  );
}

function UserBubble({ content }: { content: string }) {
  return (
    <div className="max-w-[min(85%,28rem)] rounded-2xl rounded-br-md bg-telkom-red px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap text-white">
      {content}
    </div>
  );
}

function AssistantMessage({
  message,
  userName,
}: {
  message: TellsMessage;
  userName: string;
}) {
  const hasReferences = (message.citations?.length ?? 0) > 0;

  return (
    <div className="flex max-w-[min(92%,36rem)] gap-2.5">
      <ChatAvatar role="assistant" userName={userName} />

      <div className="min-w-0 flex-1 space-y-2">
        <div className="rounded-2xl rounded-bl-md bg-telkom-grey-50 px-4 py-2.5 text-sm leading-relaxed text-telkom-grey-900">
          {renderReplyWithMarkers(message.content)}
        </div>

        {hasReferences && (
          <div className="space-y-2 rounded-xl bg-telkom-grey-50 p-3">
            <div className="flex items-center gap-2 text-xs font-medium text-telkom-grey-500">
              <FileText className="size-3.5 text-telkom-red" />
              Referensi dokumen
            </div>

            <div className="space-y-2">
              {message.citations!.map((citation) => (
                <ReferenceCard
                  key={`${citation.documentId}-${citation.refIndex ?? citation.title}`}
                  citation={citation}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function TellsChat({
  conversationId,
  initialMessages,
  loadingConversation = false,
  historyOpen = true,
  onToggleHistory,
  onConversationCreated,
  onConversationUpdated,
}: TellsChatProps) {
  const [messages, setMessages] = useState<TellsMessage[]>(initialMessages);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    conversationId ?? null
  );
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState("Pengguna");
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMe()
      .then((user) => {
        if (user) setUserName(user.name || user.email);
      })
      .catch(() => setUserName("Pengguna"));
  }, []);

  useEffect(() => {
    setMessages(initialMessages);
    setActiveConversationId(conversationId ?? null);
    setError(null);
  }, [conversationId, initialMessages]);

  useEffect(() => {
    if (messages.length === 0 && !loading) return;
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [messages, loading, loadingConversation]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading || loadingConversation) return;

    const nextMessages: TellsMessage[] = [
      ...messages,
      { role: "user", content: text },
    ];

    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const history = nextMessages
        .filter((m) => m.role === "user" || (m.role === "assistant" && nextMessages.indexOf(m) > 0))
        .slice(0, -1);

      const result = await sendTellsMessage(
        text,
        history,
        activeConversationId ?? undefined
      );

      if (!activeConversationId) {
        setActiveConversationId(result.conversationId);
        onConversationCreated?.(result.conversationId, text);
      } else {
        onConversationUpdated?.();
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: result.reply,
          citations: result.citations,
        },
      ]);
    } catch {
      setError("Gagal menghubungi server TELLS.");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Maaf, terjadi kesalahan koneksi ke backend. Pastikan backend berjalan.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const showWelcome = !loadingConversation && messages.length === 0;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white">
      {!historyOpen && onToggleHistory && (
        <div className="shrink-0 px-4 py-2 md:px-6">
          <TellsHistoryToggle onClick={onToggleHistory} />
        </div>
      )}

      <div
        ref={scrollContainerRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 md:px-6"
        onWheel={(e) => e.stopPropagation()}
      >
        <div
          className={cn(
            "mx-auto flex w-full max-w-3xl flex-col",
            showWelcome ? "min-h-full" : "gap-5"
          )}
        >
          {loadingConversation ? (
            <div className="flex justify-center py-16">
              <SearchLoadingIndicator size="sm" message="Memuat percakapan..." />
            </div>
          ) : showWelcome ? (
            <TellsWelcomeHero userName={userName} />
          ) : (
            messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={cn(
                  "flex gap-2.5",
                  message.role === "user" ? "flex-row-reverse" : "flex-row"
                )}
              >
                {message.role === "user" ? (
                  <>
                    <ChatAvatar role="user" userName={userName} />
                    <UserBubble content={message.content} />
                  </>
                ) : (
                  <AssistantMessage message={message} userName={userName} />
                )}
              </div>
            ))
          )}

          {loading && (
            <div className="flex gap-2.5">
              <ChatAvatar role="assistant" userName={userName} />
              <div className="rounded-2xl rounded-bl-md bg-telkom-grey-50 px-4 py-3">
                <SearchLoadingIndicator
                  size="sm"
                  message="Mencari dokumen relevan..."
                />
              </div>
            </div>
          )}

        </div>
      </div>

      <div className="shrink-0 bg-telkom-grey-50 px-4 py-3 md:px-6">
        <div className="mx-auto w-full max-w-3xl">
          {error && <p className="mb-2 text-xs text-telkom-red">{error}</p>}

          <form
            onSubmit={handleSubmit}
            className="flex items-end gap-2 rounded-xl bg-white px-3 py-2 ring-1 ring-telkom-grey-100"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Contoh: Siapa pihak kedua di perjanjian Vendor A?"
              rows={1}
              disabled={loading || loadingConversation}
              className="min-h-9 max-h-32 flex-1 resize-none border-0 bg-transparent px-1 py-1.5 text-sm outline-none placeholder:text-telkom-grey-400 disabled:opacity-50"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <Button
              type="submit"
              variant="ghost"
              size="icon-sm"
              disabled={loading || loadingConversation || !input.trim()}
              className="shrink-0 text-telkom-grey-500 hover:bg-telkom-grey-100 hover:text-telkom-red disabled:opacity-40"
              aria-label="Kirim pesan"
            >
              <Send className="size-4" />
            </Button>
          </form>

          <p className="mt-2 text-[11px] text-telkom-grey-400">
            qwen2.5:7b-instruct (off)
          </p>
        </div>
      </div>
    </div>
  );
}
