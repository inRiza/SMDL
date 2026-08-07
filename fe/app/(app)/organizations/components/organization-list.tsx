"use client";

import Link from "next/link";
import type { OrganizationListItem } from "@/types/organization.types";
import { ORGANIZATION_TYPE_LABELS } from "@/types/organization.types";
import { cn } from "@/lib/utils";
import { useOrganizationSearch } from "./organization-search-provider";
import { StackedMemberAvatars } from "./member-avatars";

type OrganizationCardProps = {
  organization: OrganizationListItem;
  onTypeClick?: (type: OrganizationListItem["type"]) => void;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function OrganizationCard({
  organization,
  onTypeClick,
}: OrganizationCardProps) {
  const hasMembers = organization.memberCount > 0;

  return (
    <Link
      href={`/organizations/${organization.id}`}
      className="group flex h-full flex-col rounded-md bg-white p-4 transition-colors hover:bg-telkom-grey-50"
    >
      <div className="min-w-0 flex-1">
        <span className="line-clamp-2 text-base font-medium leading-snug text-telkom-grey-900 transition-colors group-hover:text-telkom-red">
          {organization.name}
        </span>

        {organization.description && (
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-telkom-grey-500">
            {organization.description}
          </p>
        )}
      </div>

      <div
        className={cn(
          "mt-4 flex flex-wrap items-center gap-2 text-xs text-telkom-grey-500",
          hasMembers && "justify-between gap-3"
        )}
      >
        {hasMembers && (
          <StackedMemberAvatars
            members={organization.membersPreview}
            total={organization.memberCount}
          />
        )}

        <div className="flex flex-wrap items-center gap-2">
          {onTypeClick ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onTypeClick(organization.type);
              }}
              className="cursor-pointer rounded-full bg-telkom-grey-100 px-2 py-0.5 font-medium text-telkom-grey-700 transition-colors hover:bg-telkom-grey-200"
            >
              {ORGANIZATION_TYPE_LABELS[organization.type]}
            </button>
          ) : (
            <span className="rounded-full bg-telkom-grey-100 px-2 py-0.5 font-medium text-telkom-grey-700">
              {ORGANIZATION_TYPE_LABELS[organization.type]}
            </span>
          )}

          <span className="rounded-full bg-telkom-grey-100 px-2 py-0.5 font-medium text-telkom-grey-700">
            {organization.documentCount} dokumen
          </span>

          <span className="text-telkom-grey-400">{formatDate(organization.createdAt)}</span>
        </div>
      </div>
    </Link>
  );
}

type OrganizationListProps = {
  organizations: OrganizationListItem[];
};

export function OrganizationList({ organizations }: OrganizationListProps) {
  const { navigate } = useOrganizationSearch();

  if (organizations.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-base font-medium text-telkom-grey-900">
          Organisasi tidak ditemukan
        </p>
        <p className="mt-2 text-sm text-telkom-grey-500">
          Coba ubah kata kunci pencarian atau filter yang digunakan.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 py-4 sm:grid-cols-2 xl:grid-cols-3">
      {organizations.map((organization) => (
        <OrganizationCard
          key={organization.id}
          organization={organization}
          onTypeClick={(type) =>
            navigate(`/organizations?type=${encodeURIComponent(type)}&page=1`)
          }
        />
      ))}
    </div>
  );
}

export function OrganizationTypeBadge({
  type,
  className,
}: {
  type: OrganizationListItem["type"];
  className?: string;
}) {
  return (
    <span
      className={cn(
        "rounded-full bg-telkom-grey-100 px-2 py-0.5 text-xs font-medium text-telkom-grey-700",
        className
      )}
    >
      {ORGANIZATION_TYPE_LABELS[type]}
    </span>
  );
}
