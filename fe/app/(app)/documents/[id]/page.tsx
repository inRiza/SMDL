import { AppHeader } from "@/components/app/app-header";
import { PagePlaceholder } from "@/components/app/page-placeholder";

type DocumentDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function DocumentDetailPage({
  params,
}: DocumentDetailPageProps) {
  const { id } = await params;

  return (
    <>
      <AppHeader
        title="Detail Dokumen"
        description={`Dokumen #${id}`}
      />
      <PagePlaceholder
        title={`Dokumen #${id}`}
        description="Preview dokumen, metadata, dan hasil ekstraksi LER akan ditampilkan di sini."
      />
    </>
  );
}
