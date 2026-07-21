"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ExternalLink, FileText, Send } from "lucide-react";
import { SearchLoadingIndicator } from "@/components/app/search-loading-indicator";
import { Button } from "@/components/ui/button";
import { sendTellsMessage } from "@/lib/api/tells/route";
import type { TellsCitation, TellsMessage } from "@/types/tells.types";
import { cn } from "@/lib/utils";

type TellsChatProps = {
  conversationId?: string | null;
  initialMessages: TellsMessage[];
  loadingConversation?: boolean;
  onConversationCreated?: (id: string, title: string) => void;
  onConversationUpdated?: () => void;
};

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
        className="mx-0.5 inline-flex size-4 items-center justify-center rounded-sm bg-telkom-red/10 text-[10px] font-semibold text-telkom-red"
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
      className="group block rounded-sm border border-telkom-grey-200 bg-white p-2.5 transition-colors hover:border-telkom-red/30 hover:bg-telkom-grey-50"
    >
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-sm bg-telkom-red/10 text-[11px] font-semibold text-telkom-red">
          {citation.refIndex ?? "·"}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="line-clamp-1 text-sm font-medium text-telkom-black group-hover:text-telkom-red">
              {citation.title}
            </p>
            <ExternalLink className="size-3.5 shrink-0 text-telkom-grey-400 opacity-0 transition-opacity group-hover:opacity-100" />
          </div>

          <p className="mt-0.5 text-[11px] text-telkom-grey-500">
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

function AssistantMessage({ message }: { message: TellsMessage }) {
  const hasReferences = (message.citations?.length ?? 0) > 0;

  return (
    <div className="max-w-[92%] space-y-2">
      <div className="rounded-sm bg-telkom-grey-100 px-3 py-2 text-sm leading-relaxed text-telkom-black">
        {renderReplyWithMarkers(message.content)}
      </div>

      {hasReferences && (
        <div className="space-y-2 rounded-sm border border-telkom-grey-200 bg-white p-3">
          <div className="flex items-center gap-2 text-xs font-medium text-telkom-grey-600">
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
  );
}

export function TellsChat({
  conversationId,
  initialMessages,
  loadingConversation = false,
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
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(initialMessages);
    setActiveConversationId(conversationId ?? null);
    setError(null);
  }, [conversationId, initialMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
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

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 md:px-6">
        <div className="mx-auto flex w-full max-w-3xl flex-col space-y-4">
          {loadingConversation ? (
            <div className="flex justify-center py-16">
              <SearchLoadingIndicator size="sm" message="Memuat percakapan..." />
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={cn(
                  "flex",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.role === "user" ? (
                  <div className="max-w-[85%] rounded-sm bg-telkom-red px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap text-white">
                    {message.content}
                  </div>
                ) : (
                  <AssistantMessage message={message} />
                )}
              </div>
            ))
          )}

          {loading && (
            <div className="flex justify-start">
              <div className="rounded-sm border border-telkom-grey-200 bg-white px-5 py-4">
                <SearchLoadingIndicator
                  size="sm"
                  message="Mencari dokumen relevan..."
                />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      <div className="shrink-0 border-t border-telkom-grey-200 bg-white px-4 py-3 shadow-[0_-6px_16px_rgba(17,17,17,0.04)] md:px-6">
        <div className="mx-auto w-full max-w-3xl">
          {error && <p className="mb-2 text-xs text-telkom-red">{error}</p>}

          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Contoh: Siapa pihak kedua di perjanjian Vendor A?"
              rows={1}
              disabled={loading || loadingConversation}
              className="min-h-10 max-h-32 flex-1 resize-none rounded-sm border border-telkom-grey-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition-colors hover:bg-telkom-grey-100 focus:bg-telkom-grey-100 disabled:opacity-50"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <Button
              type="submit"
              disabled={loading || loadingConversation || !input.trim()}
              className="h-10 shrink-0 cursor-pointer bg-telkom-red hover:bg-telkom-red-dark"
            >
              <Send className="size-4" />
              Kirim
            </Button>
          </form>

          <p className="mt-2 text-[11px] text-telkom-grey-500">
            qwen2.5:7b-instruct (off)
          </p>
        </div>
      </div>
    </div>
  );
}
