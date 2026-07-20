import { WikiListItem } from "./wiki-card";
import type { DocumentListItem } from "@/types/document.types";

type DocumentListProps = {
  documents: DocumentListItem[];
};

export function DocumentList({ documents }: DocumentListProps) {
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
        <WikiListItem key={document.id} document={document} />
      ))}
    </div>
  );
}
