import Link from "next/link";
import { AppHeader } from "@/components/app/app-header";
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
      <>
        <AppHeader title="Detail Dokumen" description="Dokumen tidak ditemukan" />
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
          <p className="text-base font-medium text-telkom-black">
            Dokumen tidak ditemukan
          </p>
          <p className="mt-2 text-sm text-telkom-grey-600">
            Dokumen dengan ID tersebut tidak ada atau Anda tidak memiliki akses.
          </p>
          <Link
            href="/wiki"
            className="mt-6 text-sm font-medium text-telkom-red hover:underline"
          >
            Kembali ke Wiki
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <DocumentDetailView document={document} />
    </>
  );
}
