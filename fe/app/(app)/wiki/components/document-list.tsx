"use client";

import type { DocumentListItem } from "@/types/document.types";
import { WikiDocumentCard } from "./wiki-card";

type DocumentListProps = {
  documents: DocumentListItem[];
};

export function DocumentList({ documents }: DocumentListProps) {
  if (documents.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-base font-medium text-telkom-grey-900">
          Dokumen tidak ditemukan
        </p>
        <p className="mt-2 text-sm text-telkom-grey-500">
          Coba ubah kata kunci pencarian atau filter yang digunakan.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-telkom-grey-100">
      {documents.map((document) => (
        <WikiDocumentCard key={document.id} document={document} />
      ))}
    </div>
  );
}
