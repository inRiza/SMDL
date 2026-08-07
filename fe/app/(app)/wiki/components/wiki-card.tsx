"use client";

import Link from "next/link";
import { File } from "lucide-react";
import type { DocumentListItem, FileFormat } from "@/types/document.types";
import { cn } from "@/lib/utils";

const tableRowClass =
  "grid grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-x-4 px-4 py-2.5 sm:grid-cols-[2.5rem_minmax(0,1fr)_9rem] md:px-5 md:grid-cols-[2.5rem_minmax(0,1fr)_10rem_6.5rem] lg:grid-cols-[2.5rem_minmax(0,1fr)_10rem_6.5rem_5rem_7rem]";

type WikiListItemProps = {
  document: DocumentListItem;
  onCategoryClick?: (category: string) => void;
};

const mapFileFormatToIcon: Record<FileFormat, string> = {
  docx: "https://api.iconify.design/arcticons/docx-reader.svg",
  pdf: "https://api.iconify.design/bxs/file-pdf.svg",
};

const statusLabel: Record<DocumentListItem["status"], string> = {
  ready: "Siap",
  processing: "Diproses",
  ler_failed: "LER Gagal",
};

const statusClass: Record<DocumentListItem["status"], string> = {
  ready: "text-telkom-grey-700",
  processing: "text-telkom-grey-600",
  ler_failed: "text-telkom-red",
};

function formatFileSize(bytes: string) {
  const size = Number(bytes);
  if (Number.isNaN(size)) return "—";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function WikiListItem({ document, onCategoryClick }: WikiListItemProps) {
  const iconSrc = mapFileFormatToIcon[document.fileFormat];

  return (
    <Link
      href={`/documents/${document.id}`}
      className={cn(
        tableRowClass,
        "group border-b border-telkom-grey-100 transition-colors last:border-b-0 hover:bg-telkom-grey-50"
      )}
    >
      <div className="flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={iconSrc}
          alt={document.fileFormat.toUpperCase()}
          width={20}
          height={20}
          className="size-5 object-contain"
        />
      </div>

      <div className="min-w-0">
        <p className="truncate text-sm text-telkom-grey-900 transition-colors group-hover:text-telkom-red group-hover:underline">
          {document.title}
        </p>
        {document.description && (
          <p className="mt-0.5 truncate text-xs text-telkom-grey-500 sm:hidden">
            {document.description}
          </p>
        )}
      </div>

      <div className="hidden min-w-0 sm:block">
        {document.category ? (
          onCategoryClick ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onCategoryClick(document.category!);
              }}
              className="max-w-full cursor-pointer truncate text-left text-sm text-telkom-grey-700 transition-colors hover:text-telkom-red hover:underline"
            >
              {document.category}
            </button>
          ) : (
            <span className="truncate text-sm text-telkom-grey-700">
              {document.category}
            </span>
          )
        ) : (
          <span className="text-sm text-telkom-grey-400">—</span>
        )}
      </div>

      <div className="hidden min-w-0 md:block">
        <span className={cn("text-sm", statusClass[document.status])}>
          {statusLabel[document.status]}
        </span>
      </div>

      <div className="hidden text-sm text-telkom-grey-700 lg:block">
        {formatFileSize(document.fileSizeBytes)}
      </div>

      <div className="hidden text-sm text-telkom-grey-700 lg:block">
        <time dateTime={document.createdAt}>{formatDate(document.createdAt)}</time>
      </div>
    </Link>
  );
}

export function WikiListHeader() {
  return (
    <div
      className={cn(
        tableRowClass,
        "border-b border-telkom-grey-200 bg-telkom-grey-100 py-3"
      )}
    >
      <div className="flex items-center justify-center text-telkom-grey-600">
        <File className="size-[18px]" strokeWidth={1.75} />
      </div>
      <span className="text-sm font-semibold text-telkom-grey-800">Nama</span>
      <span className="hidden text-sm font-semibold text-telkom-grey-800 sm:block">
        Kategori
      </span>
      <span className="hidden text-sm font-semibold text-telkom-grey-800 md:block">
        Status
      </span>
      <span className="hidden text-sm font-semibold text-telkom-grey-800 lg:block">
        Ukuran
      </span>
      <span className="hidden text-sm font-semibold text-telkom-grey-800 lg:block">
        Diubah
      </span>
    </div>
  );
}
