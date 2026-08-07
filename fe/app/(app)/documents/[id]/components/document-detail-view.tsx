import Link from "next/link";
import { ArrowLeft, Download, FileText, HardDrive } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DocumentDetail } from "@/types/document.types";
import {
  DocumentMetadata,
  DocumentPreview,
  LerResultsPanel,
} from "./document-detail-sections";

const statusLabel: Record<DocumentDetail["status"], string> = {
  ready: "Siap",
  processing: "Diproses",
  ler_failed: "LER Gagal",
};

type DocumentDetailViewProps = {
  document: DocumentDetail;
};

export function DocumentDetailView({ document }: DocumentDetailViewProps) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <div className="bg-white px-4 py-3 md:px-6">
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-telkom-grey-600"
          render={<Link href="/wiki" aria-label="Kembali ke Wiki" />}
        >
          <ArrowLeft className="size-4" />
        </Button>
      </div>

      <section className="bg-white px-4 pb-6 md:px-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-telkom-grey-500">
              <span className="rounded-full bg-telkom-grey-100 px-2.5 py-0.5 font-medium text-telkom-grey-700">
                {statusLabel[document.status]}
              </span>
              {document.category && (
                <span className="rounded-full bg-telkom-grey-100 px-2.5 py-0.5 font-medium text-telkom-grey-700">
                  {document.category}
                </span>
              )}
              <span className="inline-flex items-center gap-1 uppercase">
                <FileText className="size-3.5" />
                {document.fileFormat}
              </span>
              <span className="inline-flex items-center gap-1">
                <HardDrive className="size-3.5" />
                {formatFileSize(document.fileSizeBytes)}
              </span>
            </div>

            <h1 className="mt-3 text-2xl font-semibold text-telkom-grey-900 md:text-3xl">
              {document.title}
            </h1>

            {document.description && (
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-telkom-grey-600">
                {document.description}
              </p>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            className="shrink-0 gap-1.5"
            disabled
          >
            <Download className="size-3.5" />
            Unduh
          </Button>
        </div>
      </section>

      <div className="flex-1 bg-telkom-grey-50 px-4 py-6 md:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1 space-y-4">
            <LerResultsPanel document={document} />
            <DocumentPreview document={document} />
          </div>

          <aside className="w-full shrink-0 lg:w-80">
            <DocumentMetadata document={document} />
          </aside>
        </div>
      </div>
    </div>
  );
}

function formatFileSize(bytes: string) {
  const size = Number(bytes);
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
