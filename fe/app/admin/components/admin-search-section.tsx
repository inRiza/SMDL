"use client";

import { RefreshCw, Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AdminSearchSectionProps = {
  query: string;
  onQueryChange: (value: string) => void;
  placeholder?: string;
  loading?: boolean;
  onRefresh?: () => void;
  showFilters?: boolean;
  onToggleFilters?: () => void;
  filtersOpen?: boolean;
  hasActiveFilters?: boolean;
  filters?: React.ReactNode;
};

export function AdminSearchSection({
  query,
  onQueryChange,
  placeholder = "Cari...",
  loading = false,
  onRefresh,
  showFilters = true,
  onToggleFilters,
  filtersOpen = false,
  hasActiveFilters = false,
  filters,
}: AdminSearchSectionProps) {
  return (
    <section className="border-b border-telkom-grey-100 bg-white px-4 py-3 md:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-telkom-grey-400" />
          <Input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={placeholder}
            className="h-10 rounded-sm border-telkom-grey-200 bg-telkom-grey-50 pl-9 text-sm focus-visible:border-telkom-red focus-visible:ring-telkom-red/10"
          />
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {showFilters && onToggleFilters ? (
            <Button
              type="button"
              size="lg"
              variant="ghost"
              className={cn(
                "cursor-pointer gap-1.5 text-telkom-grey-600 hover:bg-telkom-grey-100",
                (filtersOpen || hasActiveFilters) && "bg-telkom-grey-100"
              )}
              onClick={onToggleFilters}
            >
              <SlidersHorizontal className="size-3.5" />
              Filter
            </Button>
          ) : null}
          {onRefresh ? (
            <Button
              type="button"
              size="lg"
              variant="ghost"
              className="cursor-pointer gap-1.5 text-telkom-grey-600 hover:bg-telkom-grey-100"
              onClick={onRefresh}
              disabled={loading}
            >
              <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
              Muat ulang
            </Button>
          ) : null}
        </div>
      </div>

      {filters ? (
        <div
          className={cn(
            "flex flex-wrap items-center gap-2 transition-all duration-200",
            filtersOpen || hasActiveFilters
              ? "mt-3 max-h-24 opacity-100"
              : "max-h-0 overflow-hidden opacity-0"
          )}
        >
          {filters}
        </div>
      ) : null}
    </section>
  );
}
