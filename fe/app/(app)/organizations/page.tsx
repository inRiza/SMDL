import { AppHeader } from "@/components/app/app-header";
import { PagePlaceholder } from "@/components/app/page-placeholder";

export default function OrganizationsPage() {
  return (
    <>
      <AppHeader
        title="Organisasi"
        description="Manajemen tim dan unit kerja"
      />
      <PagePlaceholder
        title="Manajemen Organisasi"
        description="Buat organisasi, undang anggota, dan kelola hak akses dokumen bersama."
      />
    </>
  );
}
