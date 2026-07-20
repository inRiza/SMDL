import { AppHeader } from "@/components/app/app-header";
import { PagePlaceholder } from "@/components/app/page-placeholder";

export default function AdminPage() {
  return (
    <>
      <AppHeader
        title="Admin"
        description="Dashboard administrator"
      />
      <PagePlaceholder
        title="Dashboard Administrator"
        description="Audit log, konfigurasi LER/SLM, dan manajemen akses pengguna."
      />
    </>
  );
}
