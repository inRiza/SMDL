import { Suspense } from "react";
import { AppHeader } from "@/components/app/app-header";
import { DocumentList } from "./components/document-list";
import { SearchFilter } from "./components/search-filter";
import {
  fetchDocumentCategories,
  fetchDocuments,
} from "@/lib/api/document/route";
import type { DocumentFilters } from "@/types/document.types";

type WikiPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getFilter(
  searchParams: Record<string, string | string[] | undefined>
): DocumentFilters {
  const get = (key: string) => {
    const value = searchParams[key];
    return typeof value === "string" ? value : undefined;
  };

  return {
    q: get("q"),
    category: get("category"),
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

  const [documentsResult, categories] = await Promise.all([
    fetchDocuments(filters),
    fetchDocumentCategories(),
  ]);

  return (
    <>
      <AppHeader
        title="Wiki"
        description="Daftar dokumen legal yang dapat diakses"
      />

      <div className="flex flex-1 flex-col">
        <Suspense
          fallback={
            <div className="h-[52px] border-b border-telkom-grey-200 bg-white" />
          }
        >
          <SearchFilter categories={categories} />
        </Suspense>

        <div className="flex items-center justify-between border-b border-telkom-grey-200 px-4 py-3 md:px-6">
          <p className="text-sm text-telkom-grey-600">
            <span className="font-medium text-telkom-black">
              {documentsResult.meta.total}
            </span>{" "}
            dokumen
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
          <DocumentList documents={documentsResult.data} />
        </div>
      </div>
    </>
  );
}
