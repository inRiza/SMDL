"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@base-ui/react/dialog";
import {
  FilePlus,
  FileText,
  GitCommitHorizontal,
  Pencil,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  revokePersonalDocument,
  updatePersonalDocument,
  uploadPersonalDocument,
} from "@/lib/api/document/route";
import {
  formatRelativeTime,
  getActivityActorName,
} from "@/lib/organization-activity";
import type { DocumentWorkspace, WorkspaceDocumentItem } from "@/types/document.types";
import { cn } from "@/lib/utils";
import { MemberAvatar } from "@/app/(app)/organizations/components/member-avatars";
import {
  WizardField,
  wizardInputClass,
  wizardPrimaryBtnClass,
  wizardSecondaryBtnClass,
  wizardTextareaClass,
} from "@/app/(app)/organizations/components/wizard-step-indicator";

type DocumentWorkspaceViewProps = {
  workspace: DocumentWorkspace;
};

const formatIcons: Record<WorkspaceDocumentItem["fileFormat"], string> = {
  docx: "https://api.iconify.design/arcticons/docx-reader.svg",
  pdf: "https://api.iconify.design/bxs/file-pdf.svg",
};

function repoGridClass(canManage: boolean) {
  return cn(
    "grid grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-x-4 gap-y-1 px-4 py-2.5 text-left",
    canManage
      ? "md:grid-cols-[2.5rem_minmax(0,1.6fr)_minmax(0,1.2fr)_6.5rem_5.5rem]"
      : "md:grid-cols-[2.5rem_minmax(0,1.6fr)_minmax(0,1.2fr)_6.5rem]"
  );
}

function getFileCommit(
  document: WorkspaceDocumentItem,
  activities: DocumentWorkspace["activities"],
  fallbackActor: string
) {
  const matched = activities.find((activity) => {
    const meta = activity.metadata as { documentId?: string } | null;
    return (
      activity.documentId === document.id ||
      meta?.documentId === document.id ||
      activity.summary.includes(`“${document.title}”`) ||
      activity.summary.includes(`"${document.title}"`)
    );
  });

  if (matched) return matched;

  return {
    id: document.id,
    documentId: document.id,
    actorId: null,
    actorName: fallbackActor,
    action: "document.uploaded",
    summary: `unggah awal “${document.title}”`,
    metadata: { documentId: document.id },
    createdAt: document.createdAt,
  };
}

function ModalShell({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40 transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Popup className="animate-wizard-scale-in fixed top-1/2 left-1/2 z-50 flex max-h-[min(680px,90vh)] w-[min(520px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-telkom-grey-200 bg-white shadow-[0_8px_24px_rgba(2,8,23,0.12)] outline-none">
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

export function DocumentWorkspaceView({ workspace }: DocumentWorkspaceViewProps) {
  const router = useRouter();
  const { user, documents, activities, canUpload } = workspace;
  const manageableDocuments = documents.filter((document) => document.canManage);
  const canManageAny = manageableDocuments.length > 0;

  const [uploadOpen, setUploadOpen] = useState(false);
  const [editDoc, setEditDoc] = useState<WorkspaceDocumentItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const latestCommit = activities[0] ?? null;

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
      <section className="bg-white px-4 pb-6 md:px-6">
        <div className="text-left mt-6">
          <div className="flex flex-wrap items-center gap-2 text-xs text-telkom-grey-500">
            <span className="rounded-full bg-telkom-grey-100 px-2.5 py-0.5 font-medium text-telkom-grey-700">
              Personal
            </span>
            <span className="inline-flex items-center gap-1">
              <FileText className="size-3.5" />
              {workspace.documentCount} dokumen
            </span>
          </div>

          <h1 className="mt-3 text-2xl font-semibold text-telkom-grey-900 md:text-3xl">
            Dokumen Saya
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-telkom-grey-600">
            Kumpulan dokumen yang anda unggah.
          </p>
        </div>

        {latestCommit && (
          <Link
            href="/documents/activity"
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
                {formatRelativeTime(latestCommit.createdAt)}
              </p>
            </div>
            <span className="shrink-0 font-mono text-xs text-telkom-grey-400">
              {latestCommit.id.slice(0, 7)}
            </span>
          </Link>
        )}
      </section>

      <div className="flex-1 bg-telkom-grey-50 px-4 py-6 md:px-6">
        {error && (
          <p className="mb-4 rounded-md border border-telkom-red/20 bg-telkom-red/5 px-4 py-3 text-sm text-telkom-red">
            {error}
          </p>
        )}

        <section className="overflow-hidden rounded-md bg-white">
          <div className="flex items-start justify-between gap-3 px-5 py-4 md:px-6">
            <div className="text-left">
              <h2 className="text-base font-semibold text-telkom-grey-900">
                Repository Dokumen
              </h2>
              <p className="mt-0.5 text-sm text-telkom-grey-500">
                Semua dokumen yang Anda unggah, termasuk dari organisasi
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
              <p className="text-sm text-telkom-grey-500">
                Belum ada dokumen. Unggah dokumen personal pertama Anda.
              </p>
            </div>
          ) : (
            <div>
              <div
                className={cn(
                  repoGridClass(canManageAny),
                  "border-y border-telkom-grey-100 bg-telkom-grey-50 text-xs font-semibold text-telkom-grey-600"
                )}
              >
                <span />
                <span>Nama</span>
                <span className="hidden md:block">Aktivitas</span>
                <span className="hidden md:block">Waktu</span>
                {canManageAny && <span className="hidden text-right md:block">Aksi</span>}
              </div>
              <ul className="divide-y divide-telkom-grey-100">
                {documents.map((document) => {
                  const fileCommit = getFileCommit(document, activities, user.email);

                  return (
                    <li key={document.id}>
                      <div
                        className={cn(
                          repoGridClass(document.canManage),
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
                          {document.organizationName && (
                            <Link
                              href={`/organizations/${document.organizationId}`}
                              className="mt-0.5 inline-block truncate text-xs text-telkom-grey-500 hover:text-telkom-grey-700 hover:underline"
                            >
                              {document.organizationName}
                            </Link>
                          )}
                        </div>
                        <p
                          className="hidden truncate text-sm text-telkom-grey-600 md:block"
                          title={fileCommit.summary}
                        >
                          {fileCommit.summary}
                        </p>
                        <span className="hidden text-sm text-telkom-grey-500 md:block">
                          {formatRelativeTime(fileCommit.createdAt)}
                        </span>
                        {document.canManage && (
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
                                  revokePersonalDocument(document.id)
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

      <UploadDocumentModal
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onSaved={() => router.refresh()}
      />
      <EditDocumentModal
        open={Boolean(editDoc)}
        document={editDoc}
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

function UploadDocumentModal({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [fileFormat, setFileFormat] = useState<"pdf" | "docx">("pdf");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatOptions = [
    { value: "pdf" as const, label: "PDF", description: "Portable Document Format" },
    { value: "docx" as const, label: "DOCX", description: "Microsoft Word Document" },
  ];

  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      title="Unggah Dokumen"
      description="Dokumen personal otomatis publik di Wiki. LER diproses setelah unggah."
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setLoading(true);
          setError(null);
          void uploadPersonalDocument({
            title,
            description: description || undefined,
            category: category || undefined,
            fileFormat,
            fileSizeBytes: 2048,
          })
            .then(() => {
              setTitle("");
              setDescription("");
              setCategory("");
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
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  document: WorkspaceDocumentItem | null;
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
      description="Ubah nama atau kategori dokumen personal."
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!document) return;
          setLoading(true);
          setError(null);
          void updatePersonalDocument(document.id, {
            title,
            category: category || null,
          })
            .then(() => {
              onOpenChange(false);
              onSaved();
            })
            .catch((err) =>
              setError(err instanceof Error ? err.message : "Gagal memperbarui")
            )
            .finally(() => setLoading(false));
        }}
      >
        <WizardField label="Judul dokumen" required>
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
          <button
            type="submit"
            disabled={loading || !title.trim()}
            className={wizardPrimaryBtnClass}
          >
            {loading ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
