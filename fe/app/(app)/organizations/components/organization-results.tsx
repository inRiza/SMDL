"use client";

import { useOrganizationSearch } from "./organization-search-provider";
import { OrganizationSearchLoading } from "./search-loading";

type OrganizationResultsProps = {
  filtersKey: string;
  children: React.ReactNode;
};

export function OrganizationResults({
  filtersKey,
  children,
}: OrganizationResultsProps) {
  const { showLoading } = useOrganizationSearch();

  if (showLoading) {
    return <OrganizationSearchLoading key={`loading-${filtersKey}`} />;
  }

  return <div key={filtersKey}>{children}</div>;
}
