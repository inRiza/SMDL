"use client";

import type { DocumentListItem } from "@/types/document.types";
import { useWikiSearch } from "./wiki-search-provider";
import { WikiListItem } from "./wiki-card";

type DocumentListProps = {
  documents: DocumentListItem[];
};

export function DocumentList({ documents }: DocumentListProps) {
  const { navigate } = useWikiSearch();

  if (documents.length === 0) {
    return (
      <div className="border-y border-telkom-grey-200 py-16 text-center">
        <p className="text-base font-medium text-telkom-black">
          Dokumen tidak ditemukan
        </p>
        <p className="mt-2 text-sm text-telkom-grey-600">
          Coba ubah kata kunci pencarian atau filter yang digunakan.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full border-t border-telkom-grey-200">
      {documents.map((document) => (
        <WikiListItem
          key={document.id}
          document={document}
          onCategoryClick={(category) =>
            navigate(`/wiki?category=${encodeURIComponent(category)}&page=1`)
          }
        />
      ))}
    </div>
  );
}
