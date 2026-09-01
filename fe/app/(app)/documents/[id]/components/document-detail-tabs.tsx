"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, FileText } from "lucide-react";
import type { DocumentDetail } from "@/types/document.types";
import {
  getDocumentDownloadUrl,
  getDocumentFileUrl,
} from "@/lib/api/document/route";
import {
  CONTENT_AREAS,
  DOCUMENT_CLASSIFICATIONS,
  DOCUMENT_SOURCES,
  DOCUMENT_TYPES,
  formatPublishedDate,
  labelForOption,
  LEGAL_STATUSES,
} from "@/lib/document-metadata";
import { cn } from "@/lib/utils";
import { formatFileSizeString } from "@/lib/file-format";
import { DocumentLerPanel } from "./document-ler-panel";
import { DocumentStructurePanel } from "./document-structure-panel";
import { DocumentSummaryPanel } from "./document-summary-panel";

const allTabs = [
  { id: "preview", label: "Preview" },
  { id: "ler", label: "LER" },
  { id: "structure", label: "Struktur" },
  { id: "summary", label: "Ringkasan AI" },
] as const;

type TabId = (typeof allTabs)[number]["id"];

type DocumentDetailTabsProps = {
  document: DocumentDetail;
};

export function DocumentDetailTabs({ document }: DocumentDetailTabsProps) {
  const isDocx = document.fileFormat === "docx";
  const showLerTab = document.lerStatus !== "idle";
  // structure and summary are both derived from LER output
  const showDerivedTabs = document.lerStatus === "completed";
  const tabs = useMemo((): Array<(typeof allTabs)[number]> => {
    const hidden = new Set<TabId>();
    if (isDocx) hidden.add("preview");
    if (!showLerTab) hidden.add("ler");
    if (!showDerivedTabs) {
      hidden.add("structure");
      hidden.add("summary");
    }
    return allTabs.filter((tab) => !hidden.has(tab.id));
  }, [isDocx, showLerTab, showDerivedTabs]);
  const defaultTab: TabId = isDocx ? "ler" : "preview";
  const [activeTab, setActiveTab] = useState<TabId>(defaultTab);

  useEffect(() => {
    if (!tabs.some((tab) => tab.id === activeTab)) {
      setActiveTab(tabs[0]?.id ?? defaultTab);
    }
  }, [activeTab, tabs, defaultTab]);
  const fileUrl = getDocumentFileUrl(document.id);
  const downloadUrl = getDocumentDownloadUrl(document.id);

  return (
    <div className="space-y-4">
      <section className="rounded-md bg-white p-5 md:p-6">
        <h2 className="text-base font-semibold text-telkom-grey-900">Metadata</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <MetaItem
            label="Klasifikasi"
            value={labelForOption(DOCUMENT_CLASSIFICATIONS, document.classification)}
          />
          <MetaItem
            label="Jenis"
            value={labelForOption(DOCUMENT_TYPES, document.documentType)}
          />
          <MetaItem
            label="Materi muatan"
            value={labelForOption(CONTENT_AREAS, document.contentArea)}
          />
          <MetaItem
            label="Tanggal terbit"
            value={formatPublishedDate(document.publishedAt)}
          />
          <MetaItem label="Revisi" value={document.revision ?? "—"} />
          <MetaItem
            label="Akses"
            value={document.visibility === "public" ? "Publik" : "Organisasi"}
          />
          <MetaItem
            label="Status"
            value={labelForOption(LEGAL_STATUSES, document.legalStatus)}
          />
          <MetaItem
            label="Sumber"
            value={labelForOption(DOCUMENT_SOURCES, document.source)}
          />
        </dl>
      </section>

      {isDocx && (
        <section className="rounded-md bg-white p-5 md:p-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-telkom-grey-50">
                <FileText className="size-5 text-telkom-grey-500" />
              </div>
              <span
                  className="text-sm text-telkom-grey-500"
                >
                  {formatFileSizeString(Number(document.fileSizeBytes ?? NaN))}
                </span>
            </div>
            <a
              href={downloadUrl}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-telkom-red px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-telkom-red/90"
            >
              <Download className="size-4" />
              Unduh dokumen
            </a>
          </div>
        </section>
      )}

      {tabs.length > 0 && (
      <section className="overflow-hidden rounded-md bg-white">
        <div className="flex gap-1 overflow-x-auto border-b border-telkom-grey-100 px-4 pt-3 md:px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "shrink-0 rounded-t-md px-4 py-2.5 text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "bg-telkom-grey-50 text-telkom-grey-900"
                  : "text-telkom-grey-500 hover:text-telkom-grey-700",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-white">
          {activeTab === "preview" && !isDocx && (
            <iframe
              title={`Preview ${document.title}`}
              src={fileUrl}
              className="block h-[min(78vh,900px)] w-full bg-telkom-grey-100"
            />
          )}

          {activeTab === "ler" && <DocumentLerPanel document={document} />}

          {activeTab === "structure" && (
            <DocumentStructurePanel document={document} />
          )}

          {activeTab === "summary" && <DocumentSummaryPanel document={document} />}
        </div>
      </section>
      )}
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-telkom-grey-500">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-telkom-grey-900">{value}</dd>
    </div>
  );
}