"use client";

import { useWikiSearch } from "./wiki-search-provider";
import { SearchLoading } from "./search-loading";

type WikiResultsProps = {
  filtersKey: string;
  children: React.ReactNode;
};

export function WikiResults({ filtersKey, children }: WikiResultsProps) {
  const { showLoading } = useWikiSearch();

  if (showLoading) {
    return <SearchLoading key={`loading-${filtersKey}`} />;
  }

  return <div key={filtersKey}>{children}</div>;
}
