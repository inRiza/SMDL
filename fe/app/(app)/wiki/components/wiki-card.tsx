import Link from "next/link";
import type { DocumentListItem } from "@/types/document.types";

type WikiListItemProps = {
  document: DocumentListItem;
};

const statusLabel: Record<DocumentListItem["status"], string> = {
  ready: "Siap",
  processing: "Diproses",
  ler_failed: "LER Gagal",
};

function formatFileSize(bytes: string) {
  const size = Number(bytes);
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

export function WikiListItem({ document }: WikiListItemProps) {
  return (
    <article className="group flex gap-4 border-b border-telkom-grey-200 py-5 last:border-b-0">
      <div className="hidden w-16 shrink-0 flex-col items-center gap-1 pt-0.5 sm:flex">
        <span className="text-[10px] font-medium uppercase tracking-wide text-telkom-grey-500">
          {document.fileFormat}
        </span>
        <span className="text-xs font-semibold text-telkom-grey-600">
          {formatFileSize(document.fileSizeBytes)}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <Link
          href={`/documents/${document.id}`}
          className="block text-base font-medium leading-snug text-telkom-black transition-colors group-hover:text-telkom-red sm:text-[17px]"
        >
          {document.title}
        </Link>

        {document.description && (
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-telkom-grey-600">
            {document.description}
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-telkom-grey-500">
          {document.category && (
            <Link
              href={`/wiki?category=${encodeURIComponent(document.category)}`}
              className="rounded-sm bg-telkom-grey-100 px-1.5 py-0.5 font-medium text-telkom-grey-700 transition-colors hover:bg-telkom-grey-200"
            >
              {document.category}
            </Link>
          )}

          <span className="rounded-sm bg-telkom-grey-100 px-1.5 py-0.5 text-xs font-bold text-telkom-grey-700">
            {statusLabel[document.status]}
          </span>

          <span className="hidden sm:inline">•</span>
          <span className="uppercase sm:hidden">{document.fileFormat}</span>
          <span className="sm:hidden">{formatFileSize(document.fileSizeBytes)}</span>
          <span className="hidden sm:inline">•</span>
          <time dateTime={document.createdAt}>{formatDate(document.createdAt)}</time>
        </div>
      </div>
    </article>
  );
}
