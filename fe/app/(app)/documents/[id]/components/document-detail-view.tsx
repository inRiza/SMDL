import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DocumentDetail } from "@/types/document.types";
import {
  DocumentMetadata,
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
    <div className="flex flex-1 flex-col">
      <div className="border-b border-telkom-grey-200 px-4 py-3 md:px-6">
        <Link
          href="/wiki"
          className="inline-flex items-center gap-1.5 text-sm text-telkom-grey-600 transition-colors hover:text-telkom-red"
        >
          <ArrowLeft className="size-3.5" />
          Kembali ke Wiki
        </Link>

        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold leading-snug text-telkom-black md:text-2xl">
              {document.title}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-sm bg-telkom-grey-100 px-1.5 py-0.5 font-bold text-telkom-grey-700">
                {statusLabel[document.status]}
              </span>
              {document.category && (
                <span className="rounded-sm bg-telkom-grey-100 px-1.5 py-0.5 font-medium text-telkom-grey-700">
                  {document.category}
                </span>
              )}
              <span className="text-telkom-grey-500 uppercase">
                {document.fileFormat}
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="shrink-0 cursor-pointer gap-1.5 hover:bg-telkom-grey-100"
            disabled
          >
            <Download className="size-3.5" />
            Unduh
          </Button>
        </div>
      </div>

      <div className="grid flex-1 lg:grid-cols-2">
        <DocumentMetadata document={document} />
        <LerResultsPanel document={document} />
      </div>
    </div>
  );
}
