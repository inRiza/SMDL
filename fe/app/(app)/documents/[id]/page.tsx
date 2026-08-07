import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchDocumentById } from "@/lib/api/document/route";
import { DocumentDetailView } from "./components/document-detail-view";

type DocumentDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function DocumentDetailPage({
  params,
}: DocumentDetailPageProps) {
  const { id } = await params;
  const document = await fetchDocumentById(id);

  if (!document) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <p className="text-base font-medium text-telkom-grey-900">
          Dokumen tidak ditemukan
        </p>
        <p className="mt-2 text-sm text-telkom-grey-500">
          Dokumen dengan ID tersebut tidak ada atau Anda tidak memiliki akses.
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="mt-6 gap-1.5 text-telkom-red"
          render={<Link href="/wiki" />}
        >
          <ArrowLeft className="size-3.5" />
          Kembali ke Wiki
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <DocumentDetailView document={document} />
    </div>
  );
}
