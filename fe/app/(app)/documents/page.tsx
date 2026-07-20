import { AppHeader } from "@/components/app/app-header";
import { PagePlaceholder } from "@/components/app/page-placeholder";

export default function DocumentsPage() {
  return (
    <>
      <AppHeader
        title="Dokumen"
        description="Manajemen dokumen legal"
      />
      <PagePlaceholder
        title="Manajemen Dokumen"
        description="Unggah, cari, dan kelola dokumen legal dalam format PDF dan DOCX."
      />
    </>
  );
}
