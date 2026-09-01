"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { DocumentFilters } from "@/types/document.types";
import {
  CONTENT_AREAS,
  DOCUMENT_CLASSIFICATIONS,
  DOCUMENT_TYPES,
} from "@/lib/document-metadata";
import { cn } from "@/lib/utils";
import { FilterDropdown } from "./filter-dropdown";
import { useWikiSearch } from "./wiki-search-provider";

const statusOptions = [
  { value: "", label: "Semua status" },
  { value: "ready", label: "Siap" },
  { value: "processing", label: "Diproses" },
  { value: "ler_failed", label: "LER gagal" },
];

const formatOptions = [
  { value: "", label: "Semua format" },
  { value: "pdf", label: "PDF" },
  { value: "docx", label: "DOCX" },
];

const sortOptions = [
  { value: "newest", label: "Terbaru" },
  { value: "oldest", label: "Terlama" },
  { value: "title_asc", label: "Judul A–Z" },
  { value: "title_desc", label: "Judul Z–A" },
];

const classificationOptions = [
  { value: "", label: "Semua klasifikasi" },
  ...DOCUMENT_CLASSIFICATIONS.map((item) => ({
    value: item.value,
    label: item.label,
  })),
];

const documentTypeOptions = [
  { value: "", label: "Semua jenis" },
  ...DOCUMENT_TYPES.map((item) => ({
    value: item.value,
    label: item.label,
  })),
];

const contentAreaOptions = [
  { value: "", label: "Semua materi muatan" },
  ...CONTENT_AREAS.map((item) => ({
    value: item.value,
    label: item.label,
  })),
];

export function SearchFilter() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { navigate } = useWikiSearch();

  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [classification, setClassification] = useState(
    searchParams.get("classification") ?? "",
  );
  const [documentType, setDocumentType] = useState(
    searchParams.get("documentType") ?? "",
  );
  const [contentArea, setContentArea] = useState(
    searchParams.get("contentArea") ?? "",
  );
  const [status, setStatus] = useState(searchParams.get("status") ?? "");
  const [fileFormat, setFileFormat] = useState(searchParams.get("fileFormat") ?? "");
  const [sort, setSort] = useState(searchParams.get("sort") ?? "newest");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setQ(searchParams.get("q") ?? "");
    setClassification(searchParams.get("classification") ?? "");
    setDocumentType(searchParams.get("documentType") ?? "");
    setContentArea(searchParams.get("contentArea") ?? "");
    setStatus(searchParams.get("status") ?? "");
    setFileFormat(searchParams.get("fileFormat") ?? "");
    setSort(searchParams.get("sort") ?? "newest");
  }, [searchParams]);

  const hasActiveFilters = Boolean(
    searchParams.get("q") ||
      searchParams.get("classification") ||
      searchParams.get("documentType") ||
      searchParams.get("contentArea") ||
      searchParams.get("status") ||
      searchParams.get("fileFormat") ||
      (searchParams.get("sort") && searchParams.get("sort") !== "newest"),
  );

  function buildUrl(next?: Partial<DocumentFilters>) {
    const params = new URLSearchParams();

    const values = {
      q: next?.q ?? q,
      classification: next?.classification ?? classification,
      documentType: next?.documentType ?? documentType,
      contentArea: next?.contentArea ?? contentArea,
      status: next?.status ?? status,
      fileFormat: next?.fileFormat ?? fileFormat,
      sort: next?.sort ?? sort,
    };

    Object.entries(values).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });

    params.set("page", "1");
    return `${pathname}?${params.toString()}`;
  }

  function applyFilters(next?: Partial<DocumentFilters>) {
    navigate(buildUrl(next));
  }

  function resetFilters() {
    setQ("");
    setClassification("");
    setDocumentType("");
    setContentArea("");
    setStatus("");
    setFileFormat("");
    setSort("newest");
    navigate(pathname);
  }

  return (
    <div className="w-full bg-white">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          applyFilters();
        }}
      >
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-telkom-grey-400" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari dokumen..."
              className="h-10 border-0 bg-transparent pl-9 shadow-none transition-colors hover:bg-telkom-grey-100 focus-visible:bg-telkom-grey-100 focus-visible:ring-0"
            />
          </div>

          <Button
            type="submit"
            size="sm"
            className="shrink-0 cursor-pointer bg-telkom-red hover:bg-telkom-red-dark"
          >
            Cari
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "shrink-0 cursor-pointer gap-1.5 text-telkom-grey-600 transition-colors hover:bg-telkom-grey-100",
              (showFilters || hasActiveFilters) && "bg-telkom-grey-100",
            )}
            onClick={() => setShowFilters((prev) => !prev)}
          >
            <SlidersHorizontal className="size-3.5" />
            Filter
          </Button>
        </div>

        <div
          className={cn(
            "transition-[opacity] duration-200",
            showFilters || hasActiveFilters
              ? "overflow-visible opacity-100"
              : "pointer-events-none h-0 overflow-hidden opacity-0",
          )}
        >
          <div className="flex flex-wrap items-center gap-1 px-3 py-2.5">
            <FilterDropdown
              label="Klasifikasi"
              value={classification}
              onChange={(value) => {
                setClassification(value);
                applyFilters({ classification: value });
              }}
              options={classificationOptions}
            />

            <FilterDivider />

            <FilterDropdown
              label="Jenis"
              value={documentType}
              onChange={(value) => {
                setDocumentType(value);
                applyFilters({ documentType: value });
              }}
              options={documentTypeOptions}
            />

            <FilterDivider />

            <FilterDropdown
              label="Materi muatan"
              value={contentArea}
              onChange={(value) => {
                setContentArea(value);
                applyFilters({ contentArea: value });
              }}
              options={contentAreaOptions}
            />

            <FilterDivider />

            <FilterDropdown
              label="Status"
              value={status}
              onChange={(value) => {
                setStatus(value);
                applyFilters({ status: value as DocumentFilters["status"] });
              }}
              options={statusOptions}
            />

            <FilterDivider />

            <FilterDropdown
              label="Format"
              value={fileFormat}
              onChange={(value) => {
                setFileFormat(value);
                applyFilters({ fileFormat: value as DocumentFilters["fileFormat"] });
              }}
              options={formatOptions}
            />

            <FilterDivider />

            <FilterDropdown
              label="Urutkan"
              value={sort}
              onChange={(value) => {
                setSort(value);
                applyFilters({ sort: value as DocumentFilters["sort"] });
              }}
              options={sortOptions}
            />

            {hasActiveFilters && (
              <>
                <FilterDivider />
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-sm px-2.5 py-1.5 text-xs font-medium text-telkom-grey-500 transition-colors hover:bg-telkom-grey-100 hover:text-telkom-red"
                >
                  <X className="size-3" />
                  Reset
                </button>
              </>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

function FilterDivider() {
  return <span className="mx-0.5 hidden h-4 w-px bg-telkom-grey-200 sm:inline" />;
}
