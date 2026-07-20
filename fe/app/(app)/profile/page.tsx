import { AppHeader } from "@/components/app/app-header";
import { PagePlaceholder } from "@/components/app/page-placeholder";

export default function ProfilePage() {
  return (
    <>
      <AppHeader
        title="Profil"
        description="Informasi akun pengguna"
      />
      <PagePlaceholder
        title="Profil Pengguna"
        description="Detail akun, peran RBAC, dan preferensi pengguna akan ditampilkan di sini."
      />
    </>
  );
}
