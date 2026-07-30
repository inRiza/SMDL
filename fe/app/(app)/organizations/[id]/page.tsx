import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, FileText, Mail } from "lucide-react";
import { AppHeader } from "@/components/app/app-header";
import { fetchOrganizationById } from "@/lib/api/organization/route";
import { ORGANIZATION_TYPE_LABELS } from "@/types/organization.types";

type OrganizationDetailPageProps = {
  params: Promise<{ id: string }>;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export default async function OrganizationDetailPage({
  params,
}: OrganizationDetailPageProps) {
  const { id } = await params;
  const organization = await fetchOrganizationById(id);

  if (!organization) {
    notFound();
  }

  return (
    <>
      <AppHeader
        title="Detail Organisasi"
        description={organization.name}
      />

      <div className="overflow-y-auto px-4 py-6 md:px-6">
        <Link
          href="/organizations"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-telkom-grey-600 transition-colors hover:text-telkom-red"
        >
          <ArrowLeft className="size-4" />
          Kembali ke daftar organisasi
        </Link>

        <div className="max-w-3xl rounded-sm border border-telkom-grey-200 bg-white">
          <div className="flex items-start gap-4 border-b border-telkom-grey-200 p-6">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-sm bg-telkom-red/10 text-telkom-red">
              <Building2 className="size-6" />
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-semibold text-telkom-black">
                {organization.name}
              </h2>

              {organization.description && (
                <p className="mt-2 text-sm leading-relaxed text-telkom-grey-600">
                  {organization.description}
                </p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="rounded-sm bg-telkom-grey-100 px-1.5 py-0.5 text-xs font-medium text-telkom-grey-700">
                  {ORGANIZATION_TYPE_LABELS[organization.type]}
                </span>
                <span className="inline-flex items-center gap-1 rounded-sm bg-telkom-grey-100 px-1.5 py-0.5 text-xs font-medium text-telkom-grey-700">
                  <FileText className="size-3" />
                  {organization.documentCount} dokumen
                </span>
              </div>
            </div>
          </div>

          <dl className="grid gap-4 p-6 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-telkom-grey-500">
                Pemilik
              </dt>
              <dd className="mt-1 flex items-center gap-1.5 text-sm text-telkom-black">
                <Mail className="size-3.5 text-telkom-grey-400" />
                {organization.ownerEmail}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-telkom-grey-500">
                Dibuat
              </dt>
              <dd className="mt-1 text-sm text-telkom-black">
                {formatDate(organization.createdAt)}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-telkom-grey-500">
                Diperbarui
              </dt>
              <dd className="mt-1 text-sm text-telkom-black">
                {formatDate(organization.updatedAt)}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </>
  );
}
