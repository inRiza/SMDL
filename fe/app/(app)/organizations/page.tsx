import { OrganizationList } from "./components/organization-list";
import { OrganizationResults } from "./components/organization-results";
import { OrganizationSearchFilter } from "./components/organization-search-filter";
import { fetchOrganizations } from "@/lib/api/organization/route";
import type { OrganizationFilters } from "@/types/organization.types";

type OrganizationsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getFilter(
  searchParams: Record<string, string | string[] | undefined>
): OrganizationFilters {
  const get = (key: string) => {
    const value = searchParams[key];
    return typeof value === "string" ? value : undefined;
  };

  return {
    q: get("q"),
    type: get("type") as OrganizationFilters["type"],
    sort: (get("sort") as OrganizationFilters["sort"]) ?? "newest",
    page: Number(get("page") ?? "1"),
    limit: 12,
    mine: get("mine") === "1" || get("mine") === "true",
  };
}

export default async function OrganizationsPage({
  searchParams,
}: OrganizationsPageProps) {
  const params = await searchParams;
  const filters = getFilter(params);
  const filtersKey = JSON.stringify(filters);

  const organizationsResult = await fetchOrganizations(filters);

  return (
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-telkom-grey-50">
        <OrganizationSearchFilter />

        <OrganizationResults filtersKey={filtersKey}>
          <div className="flex items-center justify-between px-4 py-3 md:px-6">
            <p className="text-sm text-telkom-grey-600">
              <span className="font-medium text-telkom-black">
                {organizationsResult.meta.total}
              </span>{" "}
              {filters.mine ? "organisasi saya" : "organisasi"}
              {filters.q && (
                <>
                  {" "}
                  untuk{" "}
                  <span className="font-medium text-telkom-black">
                    &ldquo;{filters.q}&rdquo;
                  </span>
                </>
              )}
            </p>
          </div>

          <div className="w-full px-4 md:px-6">
            <OrganizationList organizations={organizationsResult.data} />
          </div>
        </OrganizationResults>
      </div>
  );
}
