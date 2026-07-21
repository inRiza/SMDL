"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { DocumentFilters } from "@/types/document.types";
import { cn } from "@/lib/utils";
import { useWikiSearch } from "./wiki-search-provider";

type SearchFilterProps = {
  categories: string[];
};

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

const selectClass =
  "h-8 appearance-none rounded-sm border-0 bg-transparent py-0 pr-6 pl-0 text-sm text-telkom-grey-700 outline-none focus:ring-0";

export function SearchFilter({ categories }: SearchFilterProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { navigate } = useWikiSearch();

  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [category, setCategory] = useState(searchParams.get("category") ?? "");
  const [status, setStatus] = useState(searchParams.get("status") ?? "");
  const [fileFormat, setFileFormat] = useState(searchParams.get("fileFormat") ?? "");
  const [sort, setSort] = useState(searchParams.get("sort") ?? "newest");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setQ(searchParams.get("q") ?? "");
    setCategory(searchParams.get("category") ?? "");
    setStatus(searchParams.get("status") ?? "");
    setFileFormat(searchParams.get("fileFormat") ?? "");
    setSort(searchParams.get("sort") ?? "newest");
  }, [searchParams]);

  const hasActiveFilters = Boolean(
    searchParams.get("q") ||
      searchParams.get("category") ||
      searchParams.get("status") ||
      searchParams.get("fileFormat") ||
      (searchParams.get("sort") && searchParams.get("sort") !== "newest")
  );

  function buildUrl(next?: Partial<DocumentFilters>) {
    const params = new URLSearchParams();

    const values = {
      q: next?.q ?? q,
      category: next?.category ?? category,
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
    setCategory("");
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
        <div className="flex items-center gap-2 p-4">
          <div className="relative min-w-0 flex-1 border">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-telkom-grey-400" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari dokumen..."
              className="h-8 border-0 bg-transparent pl-9 shadow-none focus-visible:ring-0"
            />
          </div>

          <Button
            type="submit"
            size="sm"
            className="shrink-0 cursor-pointer bg-telkom-red hover:bg-telkom-red-dark py-4"
          >
            Cari
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="shrink-0 cursor-pointer gap-1.5 bg-telkom-grey-100 text-telkom-grey-600 hover:bg-telkom-grey-200 py-4"
            onClick={() => setShowFilters((prev) => !prev)}
          >
            <SlidersHorizontal className="size-3.5" />
            Filter
          </Button>
        </div>

        <div
          className={cn(
            "overflow-hidden transition-all duration-200",
            showFilters || hasActiveFilters ? "max-h-24 opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <div className="flex flex-wrap items-center gap-x-1 gap-y-2 px-3 py-2.5 text-sm">
            <FilterSelect
              label="Kategori"
              value={category}
              onChange={(value) => {
                setCategory(value);
                applyFilters({ category: value });
              }}
              options={[
                { value: "", label: "Semua kategori" },
                ...categories.map((item) => ({ value: item, label: item })),
              ]}
            />

            <FilterDivider />

            <FilterSelect
              label="Status"
              value={status}
              onChange={(value) => {
                setStatus(value);
                applyFilters({ status: value as DocumentFilters["status"] });
              }}
              options={statusOptions}
            />

            <FilterDivider />

            <FilterSelect
              label="Format"
              value={fileFormat}
              onChange={(value) => {
                setFileFormat(value);
                applyFilters({ fileFormat: value as DocumentFilters["fileFormat"] });
              }}
              options={formatOptions}
            />

            <FilterDivider />

            <FilterSelect
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
                  className="inline-flex cursor-pointer items-center gap-1 bg-telkom-grey-100 px-2 py-1 text-xs font-medium text-telkom-grey-500 transition-colors hover:bg-telkom-red/20 hover:text-telkom-red"
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
  return <span className="mx-1 hidden h-4 w-px bg-telkom-grey-200 sm:inline" />;
}

type FilterSelectProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
};

function FilterSelect({ label, value, onChange, options }: FilterSelectProps) {
  return (
    <label className="inline-flex items-center gap-1.5 px-2 py-1">
      <span className="text-xs font-medium text-telkom-grey-500">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={selectClass}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
