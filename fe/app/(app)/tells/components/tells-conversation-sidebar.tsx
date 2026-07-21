"use client";

import { MessageSquarePlus, Trash2 } from "lucide-react";
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
  conversations: TellsConversationSummary[];
  activeId: string | null;
  loading?: boolean;
  deletingId?: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
};

export function TellsConversationSidebar({
  conversations,
  activeId,
  loading = false,
  deletingId = null,
  onSelect,
  onNew,
  onDelete,
}: TellsConversationSidebarProps) {
  return (
    <aside className="flex h-auto max-h-48 shrink-0 flex-col overflow-hidden border-b border-telkom-grey-200 bg-white md:h-full md:max-h-none md:w-72 md:border-r md:border-b-0">
      <div className="flex shrink-0 items-center justify-between border-b border-telkom-grey-200 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-telkom-black">Riwayat</p>
          <p className="text-[11px] text-telkom-grey-500">Percakapan TELLS</p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onNew}
          className="h-8 cursor-pointer gap-1.5 border-telkom-grey-200 text-xs"
        >
          <MessageSquarePlus className="size-3.5" />
          Baru
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {loading ? (
          <p className="px-4 py-6 text-xs text-telkom-grey-500">Memuat riwayat...</p>
        ) : conversations.length === 0 ? (
          <p className="px-4 py-6 text-xs leading-relaxed text-telkom-grey-500">
            Belum ada percakapan tersimpan. Mulai chat baru untuk menyimpan riwayat di sini.
          </p>
        ) : (
          <ul className="divide-y divide-telkom-grey-200">
            {conversations.map((conversation) => {
              const isActive = conversation.id === activeId;
              const isDeleting = deletingId === conversation.id;

              return (
                <li key={conversation.id}>
                  <div
                    className={cn(
                      "group flex items-stretch transition-colors hover:bg-telkom-grey-50",
                      isActive &&
                        "border-r-[3px] border-telkom-red bg-telkom-grey-100 hover:bg-telkom-grey-100"
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => onSelect(conversation.id)}
                      disabled={isDeleting}
                      className="min-w-0 flex-1 px-4 py-3 text-left"
                    >
                      <p className="line-clamp-2 text-sm font-medium text-telkom-black">
                        {conversation.title}
                      </p>
                      <p className="mt-1 text-[11px] text-telkom-grey-500">
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
                      className="flex shrink-0 items-center px-3 text-telkom-grey-400 opacity-100 transition-opacity hover:text-telkom-red md:opacity-0 md:group-hover:opacity-100 disabled:opacity-40"
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
