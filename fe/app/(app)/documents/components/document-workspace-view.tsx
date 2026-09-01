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
import { DocumentLerAction } from "@/components/documents/document-ler-action";
import { LerStatusBadge } from "@/components/documents/ler-actions";
import { useConfirm } from "@/components/providers/confirm-dialog-provider";
import {
  formatRelativeTime,
  getActivityActorName,
} from "@/lib/organization-activity";
import type { DocumentWorkspace, WorkspaceDocumentItem } from "@/types/document.types";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { MemberAvatar } from "@/app/(app)/organizations/components/member-avatars";
import {
  wizardInputClass,
  wizardPrimaryBtnClass,
  wizardSecondaryBtnClass,
  WizardField,
} from "@/app/(app)/organizations/components/wizard-step-indicator";
import {
  FormField,
  FormSelect,
  formInputClass,
  formTextareaClass,
} from "@/components/documents/document-form-fields";
import {
  CONTENT_AREAS,
  DOCUMENT_CLASSIFICATIONS,
  DOCUMENT_SOURCES,
  DOCUMENT_TYPES,
  LEGAL_STATUSES,
} from "@/lib/document-metadata";

type DocumentWorkspaceViewProps = {
  workspace: DocumentWorkspace;
};

const formatIcons: Record<WorkspaceDocumentItem["fileFormat"], string> = {
  docx: "https://api.iconify.design/arcticons/docx-reader.svg",
  pdf: "https://api.iconify.design/bxs/file-pdf.svg",
};

function repoGridClass() {
  return cn(
    "grid grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-x-4 gap-y-1 px-4 py-2.5 text-left",
    "md:grid-cols-[2.5rem_minmax(0,1.4fr)_minmax(0,1fr)_7rem_6.5rem_5.5rem]"
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
  const confirm = useConfirm();
  const { user, documents, activities, canUpload } = workspace;

  const [uploadOpen, setUploadOpen] = useState(false);
  const [editDoc, setEditDoc] = useState<WorkspaceDocumentItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const latestCommit = activities[0] ?? null;

  async function runAction(
    id: string,
    action: () => Promise<void>,
    successMessage?: string
  ) {
    setBusyId(id);
    setError(null);
    try {
      await action();
      if (successMessage) toast.success(successMessage);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan";
      setError(message);
      toast.error(message);
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
                size="sm"
                variant="outline"
                className="shrink-0 gap-1.5 border-telkom-grey-200 bg-white text-telkom-grey-900 hover:bg-telkom-grey-50"
                onClick={() => setUploadOpen(true)}
              >
                <Upload className="size-4" />
                Unggah dokumen
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
                  repoGridClass(),
                  "border-y border-telkom-grey-100 bg-telkom-grey-50 text-xs font-semibold text-telkom-grey-600"
                )}
              >
                <span />
                <span>Nama</span>
                <span className="hidden md:block">Aktivitas</span>
                <span className="hidden md:block">LER</span>
                <span className="hidden md:block">Waktu</span>
                <span className="hidden text-right md:block">Aksi</span>
              </div>
              <ul className="divide-y divide-telkom-grey-100">
                {documents.map((document) => {
                  const fileCommit = getFileCommit(document, activities, user.email);

                  return (
                    <li key={document.id}>
                      <div
                        className={cn(repoGridClass(), "hover:bg-telkom-grey-50")}
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
                        <div className="hidden md:block">
                          <LerStatusBadge status={document.lerStatus ?? "idle"} />
                        </div>
                        <span className="hidden text-sm text-telkom-grey-500 md:block">
                          {formatRelativeTime(fileCommit.createdAt)}
                        </span>
                        <div className="col-span-2 flex items-center justify-end gap-0.5 md:col-span-1">
                          <DocumentLerAction
                            documentId={document.id}
                            documentTitle={document.title}
                            initialStatus={document.lerStatus ?? "idle"}
                          />
                          {document.canManage ? (
                            <>
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
                                onClick={async () => {
                                  const ok = await confirm({
                                    title: "Cabut dokumen?",
                                    description: `Dokumen “${document.title}” akan dihapus dari repository Anda.`,
                                    confirmLabel: "Cabut dokumen",
                                    variant: "destructive",
                                  });
                                  if (!ok) return;
                                  void runAction(
                                    document.id,
                                    () => revokePersonalDocument(document.id),
                                    `Dokumen “${document.title}” dicabut.`
                                  );
                                }}
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </>
                          ) : null}
                        </div>
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
  const [classification, setClassification] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [contentArea, setContentArea] = useState("");
  const [publishedAt, setPublishedAt] = useState("");
  const [revision, setRevision] = useState("");
  const [legalStatus, setLegalStatus] = useState("");
  const [source, setSource] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setTitle("");
    setDescription("");
    setClassification("");
    setDocumentType("");
    setContentArea("");
    setPublishedAt("");
    setRevision("");
    setLegalStatus("");
    setSource("");
    setFile(null);
    setError(null);
  }

  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      title="Tambah Dokumen"
      description="Unggah dokumen kebijakan atau peraturan internal."
    >
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (!file) {
            setError("File wajib dipilih");
            return;
          }
          setLoading(true);
          setError(null);
          void uploadPersonalDocument({
            title,
            description: description || undefined,
            classification: classification || undefined,
            documentType: documentType || undefined,
            contentArea: contentArea || undefined,
            publishedAt: publishedAt || undefined,
            revision: revision || undefined,
            legalStatus: legalStatus || undefined,
            source: source || undefined,
            file,
          })
            .then(() => {
              resetForm();
              onOpenChange(false);
              toast.success("Dokumen berhasil diunggah.");
              onSaved();
            })
            .catch((err) => {
              const message = err instanceof Error ? err.message : "Gagal unggah";
              setError(message);
              toast.error(message);
            })
            .finally(() => setLoading(false));
        }}
      >
        <FormField label="File dokumen" required>
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl bg-telkom-grey-50 px-4 py-8 text-center transition-colors hover:bg-telkom-grey-100">
            <input
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={(e) => {
                const picked = e.target.files?.[0] ?? null;
                setFile(picked);
                if (picked && !title.trim()) {
                  setTitle(picked.name.replace(/\.(pdf|docx)$/i, ""));
                }
              }}
              required
            />
            <Upload className="mb-2 size-5 text-telkom-grey-500" />
            <span className="text-sm font-medium text-telkom-grey-900">
              {file ? file.name : "Pilih file PDF atau DOCX"}
            </span>
            <span className="mt-1 text-xs text-telkom-grey-500">
              Klik untuk memilih file dari perangkat Anda
            </span>
          </label>
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Klasifikasi">
            <FormSelect
              value={classification}
              onChange={setClassification}
              options={DOCUMENT_CLASSIFICATIONS}
              placeholder="Pilih klasifikasi"
            />
          </FormField>
          <FormField label="Jenis dokumen">
            <FormSelect
              value={documentType}
              onChange={setDocumentType}
              options={DOCUMENT_TYPES}
              placeholder="Pilih jenis"
            />
          </FormField>
          <FormField label="Materi muatan">
            <FormSelect
              value={contentArea}
              onChange={setContentArea}
              options={CONTENT_AREAS}
              placeholder="Pilih materi muatan"
            />
          </FormField>
          <FormField label="Sumber">
            <FormSelect
              value={source}
              onChange={setSource}
              options={DOCUMENT_SOURCES}
              placeholder="Pilih sumber"
            />
          </FormField>
          <FormField label="Tanggal terbit">
            <input
              type="date"
              value={publishedAt}
              onChange={(e) => setPublishedAt(e.target.value)}
              className={formInputClass}
            />
          </FormField>
          <FormField label="Revisi">
            <input
              value={revision}
              onChange={(e) => setRevision(e.target.value)}
              placeholder="Contoh: Rev. 2"
              className={formInputClass}
            />
          </FormField>
          <FormField label="Status">
            <FormSelect
              value={legalStatus}
              onChange={setLegalStatus}
              options={LEGAL_STATUSES}
              placeholder="Pilih status"
            />
          </FormField>
          <FormField label="Akses">
            <FormSelect
              value="public"
              onChange={() => undefined}
              options={[{ value: "public", label: "Publik" }]}
              placeholder="Publik"
              disabled
            />
          </FormField>
        </div>

        <FormField label="Judul dokumen" required>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nama atau judul dokumen"
            className={formInputClass}
            required
          />
        </FormField>

        <FormField label="Deskripsi">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Deskripsi singkat dokumen (opsional)"
            className={formTextareaClass}
          />
        </FormField>

        {error && <p className="text-sm text-telkom-red">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            className={wizardSecondaryBtnClass}
            onClick={() => onOpenChange(false)}
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading || !title.trim() || !file}
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
              toast.success("Dokumen berhasil diperbarui.");
              onSaved();
            })
            .catch((err) => {
              const message = err instanceof Error ? err.message : "Gagal memperbarui";
              setError(message);
              toast.error(message);
            })
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
