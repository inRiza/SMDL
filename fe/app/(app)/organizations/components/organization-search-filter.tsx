"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { OrganizationFilters, OrganizationType } from "@/types/organization.types";
import { ORGANIZATION_TYPE_LABELS } from "@/types/organization.types";
import { cn } from "@/lib/utils";
import { FilterDropdown } from "@/app/(app)/wiki/components/filter-dropdown";
import { useOrganizationSearch } from "./organization-search-provider";
import { AddNewOrganization } from "./add-new-organization";

const sortOptions = [
  { value: "newest", label: "Terbaru" },
  { value: "oldest", label: "Terlama" },
  { value: "name_asc", label: "Nama A–Z" },
  { value: "name_desc", label: "Nama Z–A" },
];

const typeOptions = [
  { value: "", label: "Semua tipe" },
  ...Object.entries(ORGANIZATION_TYPE_LABELS).map(([value, label]) => ({
    value,
    label,
  })),
];

export function OrganizationSearchFilter() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { navigate } = useOrganizationSearch();

  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [type, setType] = useState(searchParams.get("type") ?? "");
  const [sort, setSort] = useState(searchParams.get("sort") ?? "newest");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setQ(searchParams.get("q") ?? "");
    setType(searchParams.get("type") ?? "");
    setSort(searchParams.get("sort") ?? "newest");
  }, [searchParams]);

  const hasActiveFilters = Boolean(
    searchParams.get("q") ||
      searchParams.get("type") ||
      (searchParams.get("sort") && searchParams.get("sort") !== "newest")
  );

  function buildUrl(next?: Partial<OrganizationFilters>) {
    const params = new URLSearchParams();

    const values = {
      q: next?.q ?? q,
      type: next?.type ?? type,
      sort: next?.sort ?? sort,
    };

    Object.entries(values).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });

    params.set("page", "1");
    return `${pathname}?${params.toString()}`;
  }

  function applyFilters(next?: Partial<OrganizationFilters>) {
    navigate(buildUrl(next));
  }

  function resetFilters() {
    setQ("");
    setType("");
    setSort("newest");
    navigate(pathname);
  }

  return (
    <div className="w-full border-b border-telkom-grey-200 bg-white">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          applyFilters();
        }}
      >
        <div className="flex items-center gap-2 border-b border-telkom-grey-200 px-4 py-2">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-telkom-grey-400" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari organisasi..."
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
              (showFilters || hasActiveFilters) && "bg-telkom-grey-100"
            )}
            onClick={() => setShowFilters((prev) => !prev)}
          >
            <SlidersHorizontal className="size-3.5" />
            Filter
          </Button>

          <AddNewOrganization />
        </div>

        <div
          className={cn(
            "transition-[opacity] duration-200",
            showFilters || hasActiveFilters
              ? "overflow-visible opacity-100"
              : "pointer-events-none h-0 overflow-hidden opacity-0"
          )}
        >
          <div className="flex flex-wrap items-center gap-1 px-3 py-2.5">
            <FilterDropdown
              label="Tipe"
              value={type}
              onChange={(value) => {
                setType(value);
                applyFilters({ type: value as OrganizationType });
              }}
              options={typeOptions}
            />

            <FilterDivider />

            <FilterDropdown
              label="Urutkan"
              value={sort}
              onChange={(value) => {
                setSort(value);
                applyFilters({ sort: value as OrganizationFilters["sort"] });
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
