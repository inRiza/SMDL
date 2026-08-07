import { notFound } from "next/navigation";
import { OrganizationActivityView } from "../../components/organization-activity-view";
import { fetchOrganizationById } from "@/lib/api/organization/route";

type OrganizationActivityPageProps = {
  params: Promise<{ id: string }>;
};

export default async function OrganizationActivityPage({
  params,
}: OrganizationActivityPageProps) {
  const { id } = await params;
  const organization = await fetchOrganizationById(id);

  if (!organization) {
    notFound();
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <OrganizationActivityView organization={organization} />
    </div>
  );
}
