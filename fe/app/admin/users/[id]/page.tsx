import { AdminUserDetailView } from "@/app/admin/components/admin-user-detail-view";

type AdminUserDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminUserDetailPage({ params }: AdminUserDetailPageProps) {
  const { id } = await params;
  return <AdminUserDetailView userId={id} />;
}
