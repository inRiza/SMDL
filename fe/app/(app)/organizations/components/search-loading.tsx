"use client";

import { SearchLoadingIndicator } from "@/components/app/search-loading-indicator";

export function OrganizationSearchLoading() {
  return (
    <div className="flex flex-col items-center justify-center border-t border-telkom-grey-200 py-20">
      <SearchLoadingIndicator message="Mencari organisasi..." />
    </div>
  );
}
