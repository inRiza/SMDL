"use client";

import Link from "next/link";
import { Users } from "lucide-react";
import type { DocumentListItem, FileFormat } from "@/types/document.types";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import {
  CONTENT_AREAS,
  DOCUMENT_CLASSIFICATIONS,
  DOCUMENT_TYPES,
  labelForOption,
} from "@/lib/document-metadata";
import { cn } from "@/lib/utils";

type WikiDocumentCardProps = {
  document: DocumentListItem;
};

const mapFileFormatToIcon: Record<FileFormat, string> = {
  docx: "https://api.iconify.design/arcticons/docx-reader.svg",
  pdf: "https://api.iconify.design/bxs/file-pdf.svg",
};

function MetaBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md bg-telkom-grey-100 px-2.5 py-1 text-xs font-medium text-telkom-grey-700">
      {children}
    </span>
  );
}

function formatUploadDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function UploaderInfo({ document }: { document: DocumentListItem }) {
  if (document.organizationName) {
    return (
      <div className="flex shrink-0 items-center gap-2.5">
        <InitialsAvatar
          name={document.organizationName}
          kind="organization"
          size="default"
        />
        <div className="min-w-0 text-right">
          <p className="relative inline-block max-w-[10rem] truncate text-sm font-medium text-telkom-grey-900 sm:max-w-[14rem]">
            <Users
              className="pointer-events-none absolute top-1/2 -right-1 size-8 -translate-y-1/2 text-telkom-grey-100"
              aria-hidden
            />
            <span className="relative">{document.organizationName}</span>
          </p>
          <p className="text-xs text-telkom-grey-500">Organisasi</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-2.5">
      <InitialsAvatar name={document.ownerName} kind="user" size="default" />
      <div className="min-w-0 text-right">
        <p className="max-w-[10rem] truncate text-sm font-medium text-telkom-grey-900 sm:max-w-[14rem]">
          {document.ownerName}
        </p>
        <p className="text-xs text-telkom-grey-500">Pengunggah</p>
      </div>
    </div>
  );
}

export function WikiDocumentCard({ document }: WikiDocumentCardProps) {
  const iconSrc = mapFileFormatToIcon[document.fileFormat];

  const badges = [
    document.classification && {
      key: "classification",
      label: labelForOption(DOCUMENT_CLASSIFICATIONS, document.classification),
    },
    document.documentType && {
      key: "documentType",
      label: labelForOption(DOCUMENT_TYPES, document.documentType),
    },
    document.contentArea && {
      key: "contentArea",
      label: labelForOption(CONTENT_AREAS, document.contentArea),
    },
  ].filter(Boolean) as { key: string; label: string }[];

  return (
    <Link
      href={`/documents/${document.id}`}
      className="group block w-full px-5 py-5 transition-colors hover:bg-telkom-grey-50/80 md:px-6 md:py-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-telkom-grey-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={iconSrc}
              alt={document.fileFormat.toUpperCase()}
              width={24}
              height={24}
              className="size-6 object-contain"
            />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-telkom-grey-900 transition-colors group-hover:text-telkom-red">
              {document.title}
            </h3>
            {document.description && (
              <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-telkom-grey-500">
                {document.description}
              </p>
            )}
          </div>
        </div>

        <time
          dateTime={document.createdAt}
          className="shrink-0 text-xs text-telkom-grey-500"
        >
          {formatUploadDate(document.createdAt)}
        </time>
      </div>

      <div className="mt-4 flex items-end justify-between gap-4">
        <div className={cn("flex min-w-0 flex-1 flex-wrap gap-2", badges.length === 0 && "min-h-9")}>
          {badges.length > 0 ? (
            badges.map((badge) => (
              <MetaBadge key={badge.key}>{badge.label}</MetaBadge>
            ))
          ) : (
            <span className="text-xs text-telkom-grey-400">Belum ada kategori</span>
          )}
        </div>

        <UploaderInfo document={document} />
      </div>
    </Link>
  );
}
