"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@base-ui/react/dialog";
import {
  ArrowLeft,
  File,
  FilePlus,
  FileText,
  GitCommitHorizontal,
  LogOut,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  Users,
} from "lucide-react";
import { FilterDropdown } from "@/app/(app)/wiki/components/filter-dropdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  inviteOrganizationMembers,
  leaveOrganization,
  removeOrganizationMember,
  revokeOrganizationDocument,
  transferOrganizationOwnership,
  updateOrganization,
  updateOrganizationDocument,
  updateOrganizationMemberAccess,
  uploadOrganizationDocument,
} from "@/lib/api/organization/route";
import { fetchUsers } from "@/lib/api/user/route";
import type {
  DocumentVisibility,
  OrganizationAccessLevel,
  OrganizationDetail,
  OrganizationDocumentItem,
  OrganizationType,
} from "@/types/organization.types";
import {
  ORGANIZATION_ACCESS_LABELS,
  ORGANIZATION_TYPE_LABELS,
} from "@/types/organization.types";
import type { UserOption } from "@/types/user.types";
import { cn } from "@/lib/utils";
import {
  formatRelativeTime,
  getActivityActorName,
} from "@/lib/organization-activity";
import { MemberAvatar, StackedMemberAvatars } from "./member-avatars";
import {
  OrganizationTypePicker,
  WizardField,
  wizardInputClass,
  wizardPrimaryBtnClass,
  wizardSecondaryBtnClass,
  wizardTextareaClass,
} from "./wizard-step-indicator";

type OrganizationDetailViewProps = {
  organization: OrganizationDetail;
};

const memberRoleOptions = [
  { value: "", label: "Semua peran" },
  { value: "owner", label: "Owner" },
  { value: "member", label: "Anggota" },
  { value: "viewer", label: "Viewer" },
];

const formatIcons: Record<OrganizationDocumentItem["fileFormat"], string> = {
  docx: "https://api.iconify.design/arcticons/docx-reader.svg",
  pdf: "https://api.iconify.design/bxs/file-pdf.svg",
};

function memberGridClass(canManage: boolean) {
  return cn(
    "grid grid-cols-1 gap-2 px-3 py-2.5 text-left md:items-center md:gap-4",
    canManage
      ? "md:grid-cols-[minmax(0,1.4fr)_minmax(0,1.6fr)_6.5rem_5.5rem]"
      : "md:grid-cols-[minmax(0,1.4fr)_minmax(0,1.6fr)_6.5rem]"
  );
}

function repoGridClass(canManage: boolean) {
  return cn(
    "grid grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-x-4 gap-y-1 px-4 py-2.5 text-left",
    canManage
      ? "md:grid-cols-[2.5rem_minmax(0,1.6fr)_minmax(0,1.2fr)_6.5rem_5.5rem]"
      : "md:grid-cols-[2.5rem_minmax(0,1.6fr)_minmax(0,1.2fr)_6.5rem]"
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function formatRelative(value: string) {
  return formatRelativeTime(value);
}

export function OrganizationDetailView({ organization }: OrganizationDetailViewProps) {
  const router = useRouter();
  const canManage = organization.canManageMembers ?? organization.isOwner;
  const canUpload = organization.canUploadDocuments ?? organization.isOwner;
  const activities = organization.activities ?? [];
  const documents = organization.documents ?? [];

  const [memberQuery, setMemberQuery] = useState("");
  const [memberRoleFilter, setMemberRoleFilter] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [editOrgOpen, setEditOrgOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [transferOwnerOpen, setTransferOwnerOpen] = useState(false);
  const [leaveOrgOpen, setLeaveOrgOpen] = useState(false);
  const [editDoc, setEditDoc] = useState<OrganizationDocumentItem | null>(null);
  const [changeAccessMember, setChangeAccessMember] = useState<
    OrganizationDetail["members"][number] | null
  >(null);

  const filteredMembers = useMemo(() => {
    const q = memberQuery.trim().toLowerCase();
    return organization.members.filter((member) => {
      const matchRole = !memberRoleFilter || member.accessLevel === memberRoleFilter;
      const matchQuery =
        !q ||
        member.name.toLowerCase().includes(q) ||
        member.email.toLowerCase().includes(q);
      return matchRole && matchQuery;
    });
  }, [organization.members, memberQuery, memberRoleFilter]);

  const latestCommit = activities[0] ?? null;
  const ownerMember = organization.members.find(
    (member) => member.accessLevel === "owner"
  );
  const transferCandidates = organization.members.filter(
    (member) => member.accessLevel !== "owner" && member.userId
  );

  function getFileCommit(document: OrganizationDocumentItem) {
    const matched = activities.find((activity) => {
      const meta = activity.metadata as { documentId?: string } | null;
      return (
        meta?.documentId === document.id ||
        activity.summary.includes(`“${document.title}”`) ||
        activity.summary.includes(`"${document.title}"`)
      );
    });

    if (matched) return matched;

    return {
      id: document.id,
      actorId: null,
      actorName: organization.ownerEmail,
      action: "document.uploaded",
      summary: `unggah awal “${document.title}”`,
      metadata: { documentId: document.id },
      createdAt: document.createdAt,
    };
  }

  async function runAction(id: string, action: () => Promise<void>) {
    setBusyId(id);
    setError(null);
    try {
      await action();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <div className="bg-white px-4 py-3 md:px-6">
        <Link
          href="/organizations"
          aria-label="Kembali"
          className="inline-flex size-7 items-center justify-center rounded-lg text-telkom-grey-600 transition-colors hover:bg-telkom-grey-100"
        >
          <ArrowLeft className="size-4" />
        </Link>
      </div>

      <section className="bg-white px-4 pb-6 md:px-6">
        <div className="text-left">
          <div className="flex flex-wrap items-center gap-2 text-xs text-telkom-grey-500">
            <span className="rounded-full bg-telkom-grey-100 px-2.5 py-0.5 font-medium text-telkom-grey-700">
              {ORGANIZATION_TYPE_LABELS[organization.type]}
            </span>
            <span className="inline-flex items-center gap-1">
              <FileText className="size-3.5" />
              {organization.documentCount} dokumen
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="size-3.5" />
              {organization.memberCount} anggota
            </span>
            {organization.myAccessLevel && (
              <span className="rounded-full bg-telkom-grey-100 px-2.5 py-0.5 font-medium text-telkom-grey-700">
                {ORGANIZATION_ACCESS_LABELS[organization.myAccessLevel]}
              </span>
            )}
          </div>

          <div className="mt-3 flex items-start justify-between gap-3">
            <h1 className="text-2xl font-semibold text-telkom-grey-900 md:text-3xl">
              {organization.name}
            </h1>
            {canManage && (
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                className="shrink-0 text-telkom-grey-600"
                onClick={() => setEditOrgOpen(true)}
                aria-label="Edit organisasi"
              >
                <Pencil className="size-4" />
              </Button>
            )}
          </div>

          {organization.description && (
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-telkom-grey-600">
              {organization.description}
            </p>
          )}
        </div>

        {latestCommit && (
          <Link
            href={`/organizations/${organization.id}/activity`}
            className="mt-4 flex w-full items-center gap-3 rounded-md border border-telkom-grey-100 bg-telkom-grey-50 px-4 py-3 text-left transition-colors hover:bg-telkom-grey-100"
          >
            <MemberAvatar
              name={getActivityActorName(latestCommit)}
              size="sm"
              className="shrink-0"
            />
            <GitCommitHorizontal className="hidden size-4 shrink-0 text-telkom-grey-500 sm:block" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-telkom-grey-900">
                <span className="font-medium">{latestCommit.actorName}</span>
                <span className="text-telkom-grey-600"> {latestCommit.summary}</span>
              </p>
              <p className="mt-0.5 text-xs text-telkom-grey-500">
                {formatRelative(latestCommit.createdAt)}
              </p>
            </div>
            <span className="shrink-0 font-mono text-xs text-telkom-grey-400">
              {latestCommit.id.slice(0, 7)}
            </span>
          </Link>
        )}

        {organization.memberCount > 0 && (
          <div className="mt-5 text-left">
            <StackedMemberAvatars
              members={organization.membersPreview}
              total={organization.memberCount}
              size="md"
            />
          </div>
        )}
      </section>

      <div className="flex-1 space-y-4 bg-telkom-grey-50 px-4 py-6 md:px-6">
        {error && (
          <p className="rounded-md bg-red-50 px-4 py-2 text-sm text-telkom-red">{error}</p>
        )}

        <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <section className="rounded-md bg-white p-5 md:p-6">
            <div className="flex items-start justify-between gap-4 text-left">
              <div>
                <h2 className="text-base font-semibold text-telkom-grey-900">Anggota</h2>
                <p className="mt-0.5 text-sm text-telkom-grey-500">
                  {filteredMembers.length} dari {organization.memberCount} anggota
                </p>
              </div>
              {canManage && (
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  className="text-telkom-grey-600"
                  onClick={() => setAddMemberOpen(true)}
                  aria-label="Tambah anggota"
                >
                  <Plus className="size-4" />
                </Button>
              )}
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-telkom-grey-400" />
                <Input
                  value={memberQuery}
                  onChange={(e) => setMemberQuery(e.target.value)}
                  placeholder="Cari nama atau email..."
                  className="h-9 bg-telkom-grey-50 pl-9"
                />
              </div>
              <FilterDropdown
                label="Peran"
                value={memberRoleFilter}
                onChange={setMemberRoleFilter}
                options={memberRoleOptions}
              />
            </div>

            <div
              className={cn(
                memberGridClass(canManage),
                "mt-4 hidden border-b border-telkom-grey-100 pb-2 text-xs font-semibold text-telkom-grey-500 md:grid"
              )}
            >
              <span>Nama</span>
              <span>Email</span>
              <span>Peran</span>
              {canManage && <span className="text-right">Aksi</span>}
            </div>

            <ul className="mt-1 divide-y divide-telkom-grey-100">
              {filteredMembers.map((member) => {
                const isOwnerMember = member.accessLevel === "owner";
                const isSelfOwner =
                  organization.isOwner && member.id === organization.myMemberId;
                return (
                  <li
                    key={member.id}
                    className={cn(memberGridClass(canManage), "hover:bg-telkom-grey-50")}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <MemberAvatar name={member.name} size="default" />
                      <p className="truncate text-sm font-medium text-telkom-grey-900">
                        {member.name}
                      </p>
                    </div>
                    <p className="truncate text-sm text-telkom-grey-500">{member.email}</p>
                    <div>
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                          isOwnerMember
                            ? "bg-red-50 text-telkom-red"
                            : "bg-telkom-grey-100 text-telkom-grey-700"
                        )}
                      >
                        {ORGANIZATION_ACCESS_LABELS[member.accessLevel]}
                      </span>
                    </div>
                    {canManage && isSelfOwner ? (
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="ghost"
                          className="text-telkom-grey-600"
                          aria-label="Ubah peran owner"
                          onClick={() => setTransferOwnerOpen(true)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="ghost"
                          className="text-telkom-grey-500 hover:text-telkom-red"
                          aria-label="Tinggalkan organisasi"
                          onClick={() => setLeaveOrgOpen(true)}
                        >
                          <LogOut className="size-3.5" />
                        </Button>
                      </div>
                    ) : canManage && !isOwnerMember ? (
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="ghost"
                          className="text-telkom-grey-600"
                          disabled={busyId === member.id}
                          aria-label={`Ubah akses ${member.name}`}
                          onClick={() => setChangeAccessMember(member)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="ghost"
                          className="text-telkom-grey-500 hover:text-telkom-red"
                          disabled={busyId === member.id}
                          aria-label={`Hapus ${member.name}`}
                          onClick={() => {
                            if (!window.confirm(`Hapus ${member.name}?`)) return;
                            void runAction(member.id, () =>
                              removeOrganizationMember(organization.id, member.id)
                            );
                          }}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    ) : (
                      canManage && <span />
                    )}
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="rounded-md bg-white p-5 text-left md:p-6">
            <h2 className="text-base font-semibold text-telkom-grey-900">Tentang</h2>
            <p className="mt-0.5 text-sm text-telkom-grey-500">Informasi organisasi</p>
            <dl className="mt-5 space-y-5">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-telkom-grey-500">
                  Pemilik
                </dt>
                <dd className="mt-1.5 text-sm text-telkom-grey-900">{organization.ownerEmail}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-telkom-grey-500">
                  Tipe
                </dt>
                <dd className="mt-1.5 text-sm text-telkom-grey-900">
                  {ORGANIZATION_TYPE_LABELS[organization.type]}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-telkom-grey-500">
                  Dibuat
                </dt>
                <dd className="mt-1.5 text-sm text-telkom-grey-900">
                  {formatDate(organization.createdAt)}
                </dd>
              </div>
            </dl>
          </section>
        </div>

        <section className="overflow-hidden rounded-md bg-white">
          <div className="flex items-start justify-between gap-3 px-5 py-4 md:px-6">
            <div className="text-left">
              <h2 className="text-base font-semibold text-telkom-grey-900">
                Repository Dokumen
              </h2>
              <p className="mt-0.5 text-sm text-telkom-grey-500">
                Unggah memicu ekstraksi LER otomatis
              </p>
            </div>
            {canUpload && (
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                className="text-telkom-grey-600"
                onClick={() => setUploadOpen(true)}
                aria-label="Tambah dokumen"
              >
                <FilePlus className="size-4" />
              </Button>
            )}
          </div>

          {documents.length === 0 ? (
            <div className="px-5 pb-8 text-left md:px-6">
              <p className="text-sm text-telkom-grey-500">Belum ada dokumen di repository.</p>
            </div>
          ) : (
            <div>
              <div
                className={cn(
                  repoGridClass(canManage),
                  "border-y border-telkom-grey-100 bg-telkom-grey-50 text-xs font-semibold text-telkom-grey-600"
                )}
              >
                <span />
                <span>Nama</span>
                <span className="hidden md:block">Aktivitas</span>
                <span className="hidden md:block">Waktu</span>
                {canManage && <span className="hidden text-right md:block">Aksi</span>}
              </div>
              <ul className="divide-y divide-telkom-grey-100">
                {documents.map((document) => {
                  const fileCommit = getFileCommit(document);

                  return (
                    <li key={document.id}>
                      <div
                        className={cn(
                          repoGridClass(canManage),
                          "hover:bg-telkom-grey-50"
                        )}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={formatIcons[document.fileFormat]}
                          alt=""
                          className="size-5 object-contain"
                        />
                        <div className="min-w-0 md:col-span-1">
                          <Link
                            href={`/documents/${document.id}`}
                            className="block truncate text-sm font-medium text-telkom-grey-900 hover:underline"
                          >
                            {document.title}
                          </Link>
                          <p className="mt-0.5 truncate text-xs text-telkom-grey-500 md:hidden">
                            {fileCommit.summary}
                          </p>
                        </div>
                        <p
                          className="hidden truncate text-sm text-telkom-grey-600 md:block"
                          title={fileCommit.summary}
                        >
                          {fileCommit.summary}
                        </p>
                        <span className="hidden text-sm text-telkom-grey-500 md:block">
                          {formatRelative(fileCommit.createdAt)}
                        </span>
                        {canManage && (
                          <div className="col-span-2 flex items-center justify-end gap-1 md:col-span-1">
                            <Button
                              type="button"
                              size="icon-sm"
                              variant="ghost"
                              className="text-telkom-grey-600"
                              aria-label={`Edit ${document.title}`}
                              onClick={() => setEditDoc(document)}
                            >
                              <Pencil className="size-3.5" />
                            </Button>
                            <Button
                              type="button"
                              size="icon-sm"
                              variant="ghost"
                              className="text-telkom-grey-500 hover:text-telkom-red"
                              disabled={busyId === document.id}
                              aria-label={`Cabut ${document.title}`}
                              onClick={() => {
                                if (!window.confirm(`Cabut dokumen ${document.title}?`)) return;
                                void runAction(document.id, () =>
                                  revokeOrganizationDocument(organization.id, document.id)
                                );
                              }}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </section>
      </div>

      <EditOrganizationModal
        open={editOrgOpen}
        onOpenChange={setEditOrgOpen}
        organization={organization}
        onSaved={() => router.refresh()}
      />
      <UploadDocumentModal
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        organizationId={organization.id}
        onSaved={() => router.refresh()}
      />
      <AddMemberModal
        open={addMemberOpen}
        onOpenChange={setAddMemberOpen}
        organizationId={organization.id}
        onSaved={() => router.refresh()}
      />
      <ChangeMemberAccessModal
        open={Boolean(changeAccessMember)}
        member={changeAccessMember}
        organizationId={organization.id}
        onOpenChange={(open) => {
          if (!open) setChangeAccessMember(null);
        }}
        onSaved={() => {
          setChangeAccessMember(null);
          router.refresh();
        }}
      />
      <TransferOwnershipModal
        open={transferOwnerOpen}
        onOpenChange={setTransferOwnerOpen}
        organizationId={organization.id}
        ownerMember={ownerMember ?? null}
        candidates={transferCandidates}
        onSaved={() => {
          setTransferOwnerOpen(false);
          router.refresh();
        }}
      />
      <LeaveOrganizationModal
        open={leaveOrgOpen}
        onOpenChange={setLeaveOrgOpen}
        organizationId={organization.id}
        organizationName={organization.name}
        isOwner={organization.isOwner}
        onLeft={(deleted) => {
          setLeaveOrgOpen(false);
          router.push(deleted ? "/organizations" : `/organizations/${organization.id}`);
          router.refresh();
        }}
      />
      <EditDocumentModal
        open={Boolean(editDoc)}
        document={editDoc}
        organizationId={organization.id}
        onOpenChange={(open) => {
          if (!open) setEditDoc(null);
        }}
        onSaved={() => {
          setEditDoc(null);
          router.refresh();
        }}
      />
    </div>
  );
}

function ModalShell({
  open,
  onOpenChange,
  title,
  description,
  children,
  wide,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40 transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Popup
          className={cn(
            "animate-wizard-scale-in fixed top-1/2 left-1/2 z-50 flex max-h-[min(680px,90vh)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-telkom-grey-200 bg-white shadow-[0_8px_24px_rgba(2,8,23,0.12)] outline-none",
            wide
              ? "w-[min(640px,calc(100vw-2rem))]"
              : "w-[min(520px,calc(100vw-2rem))]"
          )}
        >
          <div className="px-6 pt-5">
            <Dialog.Title className="text-lg font-semibold text-telkom-grey-900">
              {title}
            </Dialog.Title>
            {description && (
              <Dialog.Description className="mt-1 text-sm leading-5 text-telkom-grey-500">
                {description}
              </Dialog.Description>
            )}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ChangeMemberAccessModal({
  open,
  onOpenChange,
  member,
  organizationId,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: OrganizationDetail["members"][number] | null;
  organizationId: string;
  onSaved: () => void;
}) {
  const [accessLevel, setAccessLevel] =
    useState<Exclude<OrganizationAccessLevel, "owner">>("member");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (member && open) {
      setAccessLevel(
        member.accessLevel === "viewer" ? "viewer" : "member"
      );
      setError(null);
    }
  }, [member, open]);

  if (!member) return null;

  const roleOptions: {
    value: Exclude<OrganizationAccessLevel, "owner">;
    label: string;
    description: string;
  }[] = [
    {
      value: "member",
      label: "Anggota",
      description: "Dapat melihat dan berkontribusi pada organisasi.",
    },
    {
      value: "viewer",
      label: "Viewer",
      description: "Hanya dapat melihat konten organisasi.",
    },
  ];

  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      title="Ubah hak akses anggota?"
      description={`Tentukan peran baru untuk ${member.name}.`}
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setLoading(true);
          setError(null);
          void updateOrganizationMemberAccess(organizationId, member.id, accessLevel)
            .then(() => onSaved())
            .catch((err) =>
              setError(err instanceof Error ? err.message : "Gagal mengubah akses")
            )
            .finally(() => setLoading(false));
        }}
      >
        <div className="flex items-center gap-3 rounded-md border border-telkom-grey-200 bg-telkom-grey-50 px-4 py-3">
          <MemberAvatar name={member.name} size="default" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-telkom-grey-900">{member.name}</p>
            <p className="truncate text-xs text-telkom-grey-500">{member.email}</p>
          </div>
        </div>

        <WizardField label="Pilih peran">
          <div className="grid gap-2">
            {roleOptions.map((option) => {
              const selected = accessLevel === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setAccessLevel(option.value)}
                  className={cn(
                    "cursor-pointer rounded-md border px-4 py-3 text-left transition-colors",
                    selected
                      ? "border-telkom-red bg-telkom-grey-50"
                      : "border-telkom-grey-200 bg-white hover:border-telkom-grey-300"
                  )}
                >
                  <p className="text-sm font-medium text-telkom-grey-900">{option.label}</p>
                  <p className="mt-0.5 text-xs text-telkom-grey-500">{option.description}</p>
                </button>
              );
            })}
          </div>
        </WizardField>

        {error && <p className="text-sm text-telkom-red">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            className={wizardSecondaryBtnClass}
            onClick={() => onOpenChange(false)}
          >
            Batal
          </button>
          <button type="submit" disabled={loading} className={wizardPrimaryBtnClass}>
            {loading ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function TransferOwnershipModal({
  open,
  onOpenChange,
  organizationId,
  ownerMember,
  candidates,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  ownerMember: OrganizationDetail["members"][number] | null;
  candidates: OrganizationDetail["members"];
  onSaved: () => void;
}) {
  const [demotedAccessLevel, setDemotedAccessLevel] =
    useState<Exclude<OrganizationAccessLevel, "owner">>("member");
  const [newOwnerMemberId, setNewOwnerMemberId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDemotedAccessLevel("member");
      setNewOwnerMemberId(candidates[0]?.id ?? "");
      setError(null);
    }
  }, [open, candidates]);

  if (!ownerMember) return null;

  const roleOptions: {
    value: Exclude<OrganizationAccessLevel, "owner">;
    label: string;
    description: string;
  }[] = [
    {
      value: "member",
      label: "Anggota",
      description: "Anda tetap di organisasi sebagai anggota biasa.",
    },
    {
      value: "viewer",
      label: "Viewer",
      description: "Anda tetap di organisasi dengan akses baca saja.",
    },
  ];

  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      title="Ubah peran Anda?"
      description="Untuk menurunkan peran owner, pilih anggota pengganti yang akan menjadi owner baru."
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!newOwnerMemberId) {
            setError("Pilih anggota pengganti owner");
            return;
          }
          setLoading(true);
          setError(null);
          void transferOrganizationOwnership(organizationId, {
            newOwnerMemberId,
            demotedAccessLevel,
          })
            .then(() => onSaved())
            .catch((err) =>
              setError(err instanceof Error ? err.message : "Gagal mentransfer kepemilikan")
            )
            .finally(() => setLoading(false));
        }}
      >
        <div className="flex items-center gap-3 rounded-md border border-telkom-grey-200 bg-telkom-grey-50 px-4 py-3">
          <MemberAvatar name={ownerMember.name} size="default" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-telkom-grey-900">
              {ownerMember.name}
            </p>
            <p className="truncate text-xs text-telkom-grey-500">{ownerMember.email}</p>
          </div>
        </div>

        {candidates.length === 0 ? (
          <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Tambahkan anggota lain terlebih dahulu sebelum menurunkan peran owner.
          </p>
        ) : (
          <>
            <WizardField label="Owner baru" required>
              <div className="space-y-2">
                {candidates.map((candidate) => {
                  const selected = newOwnerMemberId === candidate.id;
                  return (
                    <button
                      key={candidate.id}
                      type="button"
                      onClick={() => setNewOwnerMemberId(candidate.id)}
                      className={cn(
                        "flex w-full cursor-pointer items-center gap-3 rounded-md border px-3 py-2.5 text-left transition-colors",
                        selected
                          ? "border-telkom-red bg-telkom-grey-50"
                          : "border-telkom-grey-200 bg-white hover:border-telkom-grey-300"
                      )}
                    >
                      <MemberAvatar name={candidate.name} size="sm" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-telkom-grey-900">
                          {candidate.name}
                        </span>
                        <span className="block truncate text-xs text-telkom-grey-500">
                          {candidate.email}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </WizardField>

            <WizardField label="Peran Anda setelah transfer">
              <div className="grid gap-2">
                {roleOptions.map((option) => {
                  const selected = demotedAccessLevel === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setDemotedAccessLevel(option.value)}
                      className={cn(
                        "cursor-pointer rounded-md border px-4 py-3 text-left transition-colors",
                        selected
                          ? "border-telkom-red bg-telkom-grey-50"
                          : "border-telkom-grey-200 bg-white hover:border-telkom-grey-300"
                      )}
                    >
                      <p className="text-sm font-medium text-telkom-grey-900">{option.label}</p>
                      <p className="mt-0.5 text-xs text-telkom-grey-500">{option.description}</p>
                    </button>
                  );
                })}
              </div>
            </WizardField>
          </>
        )}

        {error && <p className="text-sm text-telkom-red">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            className={wizardSecondaryBtnClass}
            onClick={() => onOpenChange(false)}
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading || candidates.length === 0}
            className={wizardPrimaryBtnClass}
          >
            {loading ? "Menyimpan..." : "Transfer kepemilikan"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function LeaveOrganizationModal({
  open,
  onOpenChange,
  organizationId,
  organizationName,
  isOwner,
  onLeft,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  organizationName: string;
  isOwner: boolean;
  onLeft: (deleted: boolean) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) setError(null);
  }, [open]);

  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      title={isOwner ? "Tinggalkan organisasi?" : "Keluar dari organisasi?"}
      description={
        isOwner
          ? `Sebagai owner, meninggalkan ${organizationName} akan menghapus organisasi secara permanen beserta seluruh dokumennya.`
          : `Anda akan keluar dari ${organizationName} dan tidak lagi memiliki akses.`
      }
    >
      <div className="space-y-4">
        {isOwner && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-telkom-red">
            Tindakan ini tidak dapat dibatalkan.
          </p>
        )}
        {error && <p className="text-sm text-telkom-red">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            className={wizardSecondaryBtnClass}
            onClick={() => onOpenChange(false)}
          >
            Batal
          </button>
          <button
            type="button"
            disabled={loading}
            className={wizardPrimaryBtnClass}
            onClick={() => {
              setLoading(true);
              setError(null);
              void leaveOrganization(organizationId)
                .then((result) => onLeft(result.deleted))
                .catch((err) =>
                  setError(err instanceof Error ? err.message : "Gagal meninggalkan organisasi")
                )
                .finally(() => setLoading(false));
            }}
          >
            {loading
              ? "Memproses..."
              : isOwner
                ? "Hapus organisasi"
                : "Keluar organisasi"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function EditOrganizationModal({
  open,
  onOpenChange,
  organization,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organization: OrganizationDetail;
  onSaved: () => void;
}) {
  const [name, setName] = useState(organization.name);
  const [description, setDescription] = useState(organization.description ?? "");
  const [type, setType] = useState<OrganizationType>(organization.type);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(organization.name);
      setDescription(organization.description ?? "");
      setType(organization.type);
      setError(null);
    }
  }, [open, organization]);

  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Organisasi"
      description="Perbarui nama, deskripsi, dan tipe organisasi."
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setLoading(true);
          setError(null);
          void updateOrganization(organization.id, {
            name,
            description: description || null,
            type,
          })
            .then(() => {
              onOpenChange(false);
              onSaved();
            })
            .catch((err) =>
              setError(err instanceof Error ? err.message : "Gagal menyimpan")
            )
            .finally(() => setLoading(false));
        }}
      >
        <WizardField label="Nama organisasi" required>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama organisasi"
            className={wizardInputClass}
            required
          />
        </WizardField>
        <WizardField label="Deskripsi">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Deskripsi organisasi"
            className={wizardTextareaClass}
          />
        </WizardField>
        <OrganizationTypePicker value={type} onChange={setType} />
        {error && <p className="text-sm text-telkom-red">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            className={wizardSecondaryBtnClass}
            onClick={() => onOpenChange(false)}
          >
            Batal
          </button>
          <button type="submit" disabled={loading} className={wizardPrimaryBtnClass}>
            {loading ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function UploadDocumentModal({
  open,
  onOpenChange,
  organizationId,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [fileFormat, setFileFormat] = useState<"pdf" | "docx">("pdf");
  const [visibility, setVisibility] = useState<DocumentVisibility>("organization");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatOptions = [
    { value: "pdf" as const, label: "PDF", description: "Portable Document Format" },
    { value: "docx" as const, label: "DOCX", description: "Microsoft Word Document" },
  ];

  const visibilityOptions: {
    value: DocumentVisibility;
    label: string;
    description: string;
  }[] = [
    {
      value: "public",
      label: "Publik",
      description: "Dapat diakses semua pengguna SMDL, termasuk di Wiki dan TELLS.",
    },
    {
      value: "organization",
      label: "Khusus organisasi",
      description: "Hanya anggota organisasi ini yang dapat membuka dokumen.",
    },
  ];

  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      title="Unggah Dokumen"
      description="Isi metadata dokumen. LER akan diproses setelah unggah."
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setLoading(true);
          setError(null);
          void uploadOrganizationDocument(organizationId, {
            title,
            description: description || undefined,
            category: category || undefined,
            fileFormat,
            fileSizeBytes: 2048,
            visibility,
          })
            .then(() => {
              setTitle("");
              setDescription("");
              setCategory("");
              setVisibility("organization");
              onOpenChange(false);
              onSaved();
            })
            .catch((err) =>
              setError(err instanceof Error ? err.message : "Gagal unggah")
            )
            .finally(() => setLoading(false));
        }}
      >
        <div className="flex items-center gap-2 rounded-md border border-telkom-grey-200 bg-telkom-grey-50 px-3 py-3 text-sm text-telkom-grey-600">
          <Upload className="size-4 shrink-0" />
          Placeholder file — metadata disimpan & status LER = diproses
        </div>
        <WizardField label="Judul dokumen" required>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nama file / judul dokumen"
            className={wizardInputClass}
            required
          />
        </WizardField>
        <WizardField label="Kategori">
          <Input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Kategori (opsional)"
            className={wizardInputClass}
          />
        </WizardField>
        <WizardField label="Deskripsi">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Deskripsi dokumen"
            className={wizardTextareaClass}
          />
        </WizardField>
        <WizardField label="Format file">
          <div className="grid grid-cols-2 gap-2">
            {formatOptions.map((option) => {
              const selected = fileFormat === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFileFormat(option.value)}
                  className={cn(
                    "cursor-pointer rounded-md border px-3 py-3 text-left transition-colors",
                    selected
                      ? "border-telkom-red bg-telkom-grey-50"
                      : "border-telkom-grey-200 bg-white hover:border-telkom-grey-300"
                  )}
                >
                  <p className="text-sm font-medium text-telkom-grey-900">{option.label}</p>
                  <p className="mt-0.5 text-xs text-telkom-grey-500">{option.description}</p>
                </button>
              );
            })}
          </div>
        </WizardField>
        <WizardField label="Akses dokumen" required>
          <div className="grid gap-2">
            {visibilityOptions.map((option) => {
              const selected = visibility === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setVisibility(option.value)}
                  className={cn(
                    "cursor-pointer rounded-md border px-3 py-3 text-left transition-colors",
                    selected
                      ? "border-telkom-red bg-telkom-grey-50"
                      : "border-telkom-grey-200 bg-white hover:border-telkom-grey-300"
                  )}
                >
                  <p className="text-sm font-medium text-telkom-grey-900">{option.label}</p>
                  <p className="mt-0.5 text-xs text-telkom-grey-500">{option.description}</p>
                </button>
              );
            })}
          </div>
        </WizardField>
        {error && <p className="text-sm text-telkom-red">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            className={wizardSecondaryBtnClass}
            onClick={() => onOpenChange(false)}
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading || !title.trim()}
            className={wizardPrimaryBtnClass}
          >
            {loading ? "Mengunggah..." : "Unggah"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function EditDocumentModal({
  open,
  document,
  organizationId,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  document: OrganizationDocumentItem | null;
  organizationId: string;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (document && open) {
      setTitle(document.title);
      setCategory(document.category ?? "");
      setError(null);
    }
  }, [document, open]);

  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Dokumen"
      description="Ubah nama atau kategori dokumen repository."
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!document) return;
          setLoading(true);
          setError(null);
          void updateOrganizationDocument(organizationId, document.id, {
            title,
            category: category || null,
          })
            .then(() => onSaved())
            .catch((err) =>
              setError(err instanceof Error ? err.message : "Gagal menyimpan")
            )
            .finally(() => setLoading(false));
        }}
      >
        <WizardField label="Judul" required>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={wizardInputClass}
            required
          />
        </WizardField>
        <WizardField label="Kategori">
          <Input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Kategori"
            className={wizardInputClass}
          />
        </WizardField>
        {error && <p className="text-sm text-telkom-red">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            className={wizardSecondaryBtnClass}
            onClick={() => onOpenChange(false)}
          >
            Batal
          </button>
          <button type="submit" disabled={loading} className={wizardPrimaryBtnClass}>
            {loading ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function AddMemberModal({
  open,
  onOpenChange,
  organizationId,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  onSaved: () => void;
}) {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selected, setSelected] = useState<UserOption | null>(null);
  const [accessLevel, setAccessLevel] =
    useState<Exclude<OrganizationAccessLevel, "owner">>("member");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roleOptions: {
    value: Exclude<OrganizationAccessLevel, "owner">;
    label: string;
  }[] = [
    { value: "member", label: "Anggota" },
    { value: "viewer", label: "Viewer" },
  ];

  async function searchUsers(value: string) {
    setQuery(value);
    if (value.trim().length < 1) {
      setUsers([]);
      return;
    }
    try {
      const result = await fetchUsers({ q: value, limit: 8 });
      setUsers(result.data);
    } catch {
      setUsers([]);
    }
  }

  useEffect(() => {
    if (!open) {
      setQuery("");
      setUsers([]);
      setSelected(null);
      setAccessLevel("member");
      setError(null);
    }
  }, [open]);

  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      title="Tambah Anggota"
      description="Cari pengguna terdaftar lalu tentukan peran."
    >
      <div className="space-y-4">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-telkom-grey-400" />
          <Input
            value={query}
            onChange={(e) => void searchUsers(e.target.value)}
            placeholder="Cari nama atau email..."
            className={cn(wizardInputClass, "pl-10")}
          />
        </div>
        <div className="max-h-40 space-y-1 overflow-y-auto">
          {users.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => setSelected(user)}
              className={cn(
                "flex w-full cursor-pointer items-start gap-3 rounded-md border px-3 py-2.5 text-left text-sm transition-colors",
                selected?.id === user.id
                  ? "border-telkom-red bg-telkom-grey-50"
                  : "border-telkom-grey-200 bg-white hover:border-telkom-grey-300"
              )}
            >
              <MemberAvatar name={user.name} size="sm" />
              <span>
                <span className="block font-medium text-telkom-grey-900">{user.name}</span>
                <span className="block text-xs text-telkom-grey-500">{user.email}</span>
              </span>
            </button>
          ))}
        </div>
        <WizardField label="Peran">
          <div className="grid grid-cols-2 gap-2">
            {roleOptions.map((option) => {
              const selectedRole = accessLevel === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setAccessLevel(option.value)}
                  className={cn(
                    "cursor-pointer rounded-md border px-3 py-2.5 text-sm font-medium transition-colors",
                    selectedRole
                      ? "border-telkom-red bg-telkom-grey-50 text-telkom-grey-900"
                      : "border-telkom-grey-200 bg-white text-telkom-grey-700 hover:border-telkom-grey-300"
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </WizardField>
        {error && <p className="text-sm text-telkom-red">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            className={wizardSecondaryBtnClass}
            onClick={() => onOpenChange(false)}
          >
            Batal
          </button>
          <button
            type="button"
            disabled={!selected || loading}
            className={wizardPrimaryBtnClass}
            onClick={() => {
              if (!selected) return;
              setLoading(true);
              setError(null);
              void inviteOrganizationMembers(organizationId, [
                {
                  userId: selected.id,
                  name: selected.name,
                  email: selected.email,
                  accessLevel,
                },
              ])
                .then(() => {
                  onOpenChange(false);
                  onSaved();
                })
                .catch((err) =>
                  setError(err instanceof Error ? err.message : "Gagal menambah")
                )
                .finally(() => setLoading(false));
            }}
          >
            {loading ? "Menambah..." : "Tambah"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
