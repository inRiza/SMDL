"use client";

import { ChevronLeft, ChevronRight, MessageSquarePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TellsConversationSummary } from "@/types/tells.types";
import { cn } from "@/lib/utils";

function formatRelativeTime(value: string) {
  const date = new Date(value);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return "Baru saja";
  if (diffMinutes < 60) return `${diffMinutes} mnt lalu`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} jam lalu`;

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
  }).format(date);
}

type TellsConversationSidebarProps = {
  open: boolean;
  onToggle: () => void;
  conversations: TellsConversationSummary[];
  activeId: string | null;
  loading?: boolean;
  deletingId?: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
};

export function TellsConversationSidebar({
  open,
  onToggle,
  conversations,
  activeId,
  loading = false,
  deletingId = null,
  onSelect,
  onNew,
  onDelete,
}: TellsConversationSidebarProps) {
  if (!open) return null;

  return (
    <aside className="flex h-full min-h-0 flex-col overflow-hidden bg-telkom-grey-100">
      <div className="flex shrink-0 items-center justify-between px-4 py-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-telkom-grey-900">Riwayat</p>
          <p className="text-xs text-telkom-grey-500">Percakapan TELLS</p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onNew}
            className="h-8 cursor-pointer gap-1.5 text-xs text-telkom-grey-600"
          >
            <MessageSquarePlus className="size-3.5" />
            Baru
          </Button>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            onClick={onToggle}
            className="text-telkom-grey-500"
            aria-label="Sembunyikan riwayat"
          >
            <ChevronLeft className="size-4" />
          </Button>
        </div>
      </div>

      <div
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-3"
        onWheel={(e) => e.stopPropagation()}
      >
        {loading ? (
          <p className="px-2 py-4 text-xs text-telkom-grey-500">Memuat riwayat...</p>
        ) : conversations.length === 0 ? (
          <p className="px-2 py-4 text-xs leading-relaxed text-telkom-grey-500">
            Belum ada percakapan tersimpan. Mulai chat baru untuk menyimpan riwayat di sini.
          </p>
        ) : (
          <ul className="space-y-1">
            {conversations.map((conversation) => {
              const isActive = conversation.id === activeId;
              const isDeleting = deletingId === conversation.id;

              return (
                <li key={conversation.id}>
                  <div
                    className={cn(
                      "group flex items-stretch rounded-lg transition-colors hover:bg-white/80",
                      isActive && "bg-white"
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => onSelect(conversation.id)}
                      disabled={isDeleting}
                      className="min-w-0 flex-1 px-3 py-2.5 text-left"
                    >
                      <p className="line-clamp-2 text-sm font-medium text-telkom-grey-900">
                        {conversation.title}
                      </p>
                      <p className="mt-0.5 text-xs text-telkom-grey-500">
                        {formatRelativeTime(conversation.updatedAt)}
                      </p>
                    </button>

                    <button
                      type="button"
                      aria-label={`Hapus percakapan ${conversation.title}`}
                      disabled={isDeleting}
                      onClick={(event) => {
                        event.stopPropagation();
                        onDelete(conversation.id);
                      }}
                      className="flex shrink-0 items-center px-2.5 text-telkom-grey-400 opacity-100 transition-colors hover:text-telkom-red md:opacity-0 md:group-hover:opacity-100 disabled:opacity-40"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}

export function TellsHistoryToggle({
  onClick,
  className,
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={cn("gap-1.5 text-telkom-grey-600", className)}
    >
      <ChevronRight className="size-4" />
      Riwayat
    </Button>
  );
}
