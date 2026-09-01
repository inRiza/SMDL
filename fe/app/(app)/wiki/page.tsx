import { DocumentList } from "./components/document-list";
import { SearchFilter } from "./components/search-filter";
import { WikiResults } from "./components/wiki-results";
import { fetchDocuments } from "@/lib/api/document/route";
import type { DocumentFilters } from "@/types/document.types";

type WikiPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getFilter(
  searchParams: Record<string, string | string[] | undefined>,
): DocumentFilters {
  const get = (key: string) => {
    const value = searchParams[key];
    return typeof value === "string" ? value : undefined;
  };

  return {
    q: get("q"),
    classification: get("classification"),
    documentType: get("documentType"),
    contentArea: get("contentArea"),
    status: get("status") as DocumentFilters["status"],
    fileFormat: get("fileFormat") as DocumentFilters["fileFormat"],
    sort: (get("sort") as DocumentFilters["sort"]) ?? "newest",
    page: Number(get("page") ?? "1"),
    limit: 12,
  };
}

export default async function WikiPage({ searchParams }: WikiPageProps) {
  const params = await searchParams;
  const filters = getFilter(params);
  const filtersKey = JSON.stringify(filters);
  const documentsResult = await fetchDocuments(filters);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-telkom-grey-50">
      <SearchFilter />

      <WikiResults filtersKey={filtersKey}>
        <div className="flex items-center justify-between px-4 py-3 md:px-6">
          <p className="text-sm text-telkom-grey-600">
            <span className="font-medium text-telkom-grey-900">
              {documentsResult.meta.total}
            </span>{" "}
            dokumen
            {filters.q && (
              <>
                {" "}
                untuk{" "}
                <span className="font-medium text-telkom-grey-900">
                  &ldquo;{filters.q}&rdquo;
                </span>
              </>
            )}
          </p>
        </div>

        <div className="w-full px-4 md:px-6">
          <div className="overflow-hidden rounded-xl bg-white">
            <DocumentList documents={documentsResult.data} />
          </div>
        </div>
      </WikiResults>
    </div>
  );
}
