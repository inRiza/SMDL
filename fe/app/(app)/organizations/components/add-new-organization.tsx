"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@base-ui/react/dialog";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  FileUp,
  Plus,
  Search,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  createOrganization,
  inviteOrganizationMembers,
} from "@/lib/api/organization/route";
import { fetchUsers } from "@/lib/api/user/route";
import type {
  OrganizationInviteInput,
  OrganizationListItem,
  OrganizationType,
} from "@/types/organization.types";
import type { UserOption } from "@/types/user.types";
import { cn } from "@/lib/utils";
import { useOrganizationSearch } from "./organization-search-provider";
import {
  OrganizationTypePicker,
  WizardField,
  WizardStepIndicator,
  getWizardStepMeta,
  wizardInputClass,
  wizardPrimaryBtnClass,
  wizardTextareaClass,
} from "./wizard-step-indicator";

const PAGE_SIZE = 8;

type PendingInvite = OrganizationInviteInput & { key: string };

type WizardSummary = {
  organization: OrganizationListItem;
  inviteCount: number;
  pendingUploadCount: number;
};

const initialForm: {
  name: string;
  description: string;
  type: OrganizationType;
} = {
  name: "",
  description: "",
  type: "unit_kerja",
};

function userInitial(user: Pick<UserOption, "name" | "email">) {
  return (user.name || user.email).slice(0, 1).toUpperCase();
}

export function AddNewOrganization() {
  const router = useRouter();
  const { refresh } = useOrganizationSearch();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const successTimerRef = useRef<number | null>(null);
  const searchTimerRef = useRef<number | null>(null);

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [form, setForm] = useState(initialForm);
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [summary, setSummary] = useState<WizardSummary | null>(null);

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [users, setUsers] = useState<UserOption[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const stepMeta = getWizardStepMeta(step);
  const canContinueStep1 = form.name.trim().length >= 2;
  const showBack = step > 1 && step < 5;
  const selectedIds = new Set(invites.map((item) => item.userId));

  const loadUsers = useCallback(async (q: string, nextPage: number) => {
    setLoadingUsers(true);
    setError(null);

    try {
      const result = await fetchUsers({
        q: q || undefined,
        page: nextPage,
        limit: PAGE_SIZE,
      });
      setUsers(result.data);
      setPage(result.meta.page);
      setTotalPages(result.meta.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat pengguna");
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!open || step !== 2) return;
    void loadUsers(debouncedQuery, page);
  }, [open, step, debouncedQuery, page, loadUsers]);

  function resetWizard() {
    if (successTimerRef.current) {
      clearTimeout(successTimerRef.current);
      successTimerRef.current = null;
    }
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
      searchTimerRef.current = null;
    }

    setStep(1);
    setDirection("forward");
    setForm(initialForm);
    setInvites([]);
    setFiles([]);
    setError(null);
    setSubmitting(false);
    setSummary(null);
    setQuery("");
    setDebouncedQuery("");
    setUsers([]);
    setPage(1);
    setTotalPages(1);
    setLoadingUsers(false);
  }

  function goTo(nextStep: number) {
    setDirection(nextStep > step ? "forward" : "back");
    setError(null);
    setStep(nextStep);
  }

  function handleClose(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) resetWizard();
  }

  function handleQueryChange(value: string) {
    setQuery(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    searchTimerRef.current = window.setTimeout(() => {
      setDebouncedQuery(value.trim());
      setPage(1);
    }, 300);
  }

  function toggleInvite(user: UserOption) {
    setInvites((prev) => {
      if (prev.some((item) => item.userId === user.id)) {
        return prev.filter((item) => item.userId !== user.id);
      }

      return [
        ...prev,
        {
          key: crypto.randomUUID(),
          userId: user.id,
          name: user.name,
          email: user.email,
          accessLevel: "member",
        },
      ];
    });
    setError(null);
  }

  function handleFilesSelected(selected: FileList | null) {
    if (!selected) return;

    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    const next = Array.from(selected).filter(
      (file) =>
        allowed.includes(file.type) ||
        file.name.endsWith(".pdf") ||
        file.name.endsWith(".docx")
    );

    if (next.length === 0) {
      setError("Hanya file PDF atau DOCX yang didukung");
      return;
    }

    setFiles((prev) => [...prev, ...next]);
    setError(null);
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleCreate() {
    setError(null);
    setSubmitting(true);

    try {
      const organization = await createOrganization({
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        type: form.type,
      });

      let inviteCount = 0;
      if (invites.length > 0) {
        const sent = await inviteOrganizationMembers(
          organization.id,
          invites.map(({ userId, name, email, accessLevel }) => ({
            userId,
            name,
            email,
            accessLevel,
          }))
        );
        inviteCount = sent.length;
      }

      setSummary({
        organization,
        inviteCount,
        pendingUploadCount: files.length,
      });
      refresh();
      goTo(5);

      successTimerRef.current = window.setTimeout(() => {
        successTimerRef.current = null;
        handleClose(false);
        router.push(`/organizations/${organization.id}`);
      }, 1600);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat organisasi");
    } finally {
      setSubmitting(false);
    }
  }

  const stepAnimation =
    direction === "forward"
      ? "animate-wizard-slide-in-right"
      : "animate-wizard-slide-in-left";

  return (
    <Dialog.Root open={open} onOpenChange={handleClose}>
      <Dialog.Trigger
        render={
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="shrink-0 cursor-pointer gap-1.5 rounded-md border-telkom-grey-300"
          />
        }
      >
        <Plus className="size-3.5" />
        <span className="hidden sm:inline">Buat Organisasi</span>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40 transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0" />

        <Dialog.Popup className="animate-wizard-scale-in fixed top-1/2 left-1/2 z-50 flex max-h-[min(680px,90vh)] w-[min(600px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-telkom-grey-200 bg-white shadow-[0_8px_24px_rgba(2,8,23,0.12)] outline-none">
          {step < 5 && (
            <div className="relative px-6 pt-5">
              {showBack && (
                <button
                  type="button"
                  onClick={() => goTo(step - 1)}
                  disabled={submitting}
                  className="mb-4 flex cursor-pointer items-center gap-1 rounded-md px-1 py-1 text-sm text-telkom-grey-600 transition-colors hover:bg-telkom-grey-100 hover:text-telkom-grey-900 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeft className="size-4" />
                  Kembali
                </button>
              )}

              <WizardStepIndicator currentStep={step} />

              <div className="mt-6">
                <Dialog.Title className="text-lg font-semibold text-telkom-grey-900">
                  {stepMeta.title}
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-sm leading-5 text-telkom-grey-500">
                  {stepMeta.description}
                </Dialog.Description>
              </div>
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <div key={step} className={stepAnimation}>
              {step === 1 && (
                <div className="space-y-4">
                  <WizardField label="Nama organisasi" htmlFor="wizard-org-name" required>
                    <Input
                      id="wizard-org-name"
                      value={form.name}
                      onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Contoh: Divisi Legal & Compliance"
                      className={wizardInputClass}
                      autoFocus
                    />
                  </WizardField>

                  <WizardField label="Deskripsi" htmlFor="wizard-org-desc">
                    <textarea
                      id="wizard-org-desc"
                      value={form.description}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, description: e.target.value }))
                      }
                      placeholder="Jelaskan singkat fungsi organisasi ini"
                      className={wizardTextareaClass}
                    />
                  </WizardField>

                  <OrganizationTypePicker
                    value={form.type}
                    onChange={(type) => setForm((prev) => ({ ...prev, type }))}
                  />
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-telkom-grey-400" />
                    <Input
                      value={query}
                      onChange={(e) => handleQueryChange(e.target.value)}
                      placeholder="Cari nama atau email…"
                      className={cn(wizardInputClass, "pl-10")}
                      autoFocus
                    />
                  </div>

                  {invites.length > 0 && (
                    <p className="text-xs font-medium text-telkom-grey-500">
                      <span className="text-telkom-red">{invites.length}</span> dipilih
                    </p>
                  )}

                  {loadingUsers ? (
                    <div className="space-y-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full rounded-md" />
                      ))}
                    </div>
                  ) : users.length === 0 ? (
                    <p className="py-8 text-center text-sm text-telkom-grey-500">
                      Tidak ada pengguna
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {users.map((user) => {
                        const selected = selectedIds.has(user.id);

                        return (
                          <li key={user.id}>
                            <button
                              type="button"
                              onClick={() => toggleInvite(user)}
                              className={cn(
                                "flex w-full cursor-pointer items-center gap-3 rounded-md border bg-white px-4 py-3 text-left shadow-[0_1px_2px_rgba(2,8,23,0.05)] transition-colors",
                                selected
                                  ? "border-telkom-red bg-telkom-grey-50"
                                  : "border-telkom-grey-200 hover:border-telkom-grey-300 hover:bg-telkom-grey-50"
                              )}
                            >
                              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-telkom-grey-100 text-xs font-semibold text-telkom-grey-700">
                                {userInitial(user)}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-medium text-telkom-grey-900">
                                  {user.name}
                                </span>
                                <span className="block truncate text-xs text-telkom-grey-500">
                                  {user.email}
                                </span>
                              </span>
                              <span
                                className={cn(
                                  "flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                                  selected
                                    ? "border-telkom-red bg-telkom-red text-white"
                                    : "border-telkom-grey-300 bg-white text-transparent"
                                )}
                              >
                                <Check className="size-3" strokeWidth={2.5} />
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  {totalPages > 1 && (
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        disabled={page <= 1 || loadingUsers}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className="flex h-8 cursor-pointer items-center gap-1 rounded-md px-2 text-sm font-medium text-telkom-grey-600 transition-colors hover:bg-telkom-grey-100 hover:text-telkom-grey-900 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ChevronLeft className="size-4" />
                        Sebelumnya
                      </button>
                      <span className="text-xs font-medium text-telkom-grey-500">
                        {page} / {totalPages}
                      </span>
                      <button
                        type="button"
                        disabled={page >= totalPages || loadingUsers}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        className="flex h-8 cursor-pointer items-center gap-1 rounded-md px-2 text-sm font-medium text-telkom-grey-600 transition-colors hover:bg-telkom-grey-100 hover:text-telkom-grey-900 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Berikutnya
                        <ChevronRight className="size-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      handleFilesSelected(e.target.files);
                      e.target.value = "";
                    }}
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex w-full cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-telkom-grey-300 bg-telkom-grey-50 px-4 py-10 transition-colors hover:border-telkom-grey-400 hover:bg-white"
                  >
                    <div className="flex size-10 items-center justify-center rounded-md border border-telkom-grey-200 bg-white text-telkom-red">
                      <Upload className="size-4" />
                    </div>
                    <p className="mt-3 text-sm font-medium text-telkom-grey-900">
                      Pilih file untuk diunggah
                    </p>
                    <p className="mt-1 text-xs text-telkom-grey-500">PDF atau DOCX · opsional</p>
                  </button>

                  {files.length > 0 && (
                    <ul className="divide-y divide-telkom-grey-200 overflow-hidden rounded-md border border-telkom-grey-200">
                      {files.map((file, index) => (
                        <li
                          key={`${file.name}-${index}`}
                          className="flex items-center justify-between gap-3 bg-white px-4 py-3"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <FileUp className="size-4 shrink-0 text-telkom-grey-400" />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-telkom-grey-900">
                                {file.name}
                              </p>
                              <p className="text-xs text-telkom-grey-500">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="cursor-pointer rounded-md p-1 text-telkom-grey-400 transition-colors hover:bg-telkom-grey-100 hover:text-telkom-red"
                          >
                            <X className="size-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  <p className="text-xs leading-4 text-telkom-grey-500">
                    Upload penuh dan ekstraksi LER tersedia dari halaman organisasi setelah
                    pembuatan selesai.
                  </p>
                </div>
              )}

              {step === 4 && (
                <div className="flex min-h-36 flex-col items-center justify-center text-center">
                  <p className="max-w-xs text-base font-medium leading-6 text-telkom-grey-900">
                    Simpan dan buat organisasi ini?
                  </p>
                  <p className="mt-2 max-w-xs text-sm text-telkom-grey-500">
                    Anda otomatis menjadi Owner.
                    {invites.length > 0 &&
                      ` ${invites.length} anggota akan ditambahkan.`}
                  </p>
                </div>
              )}

              {step === 5 && summary && (
                <div className="flex min-h-56 flex-col items-center justify-center text-center">
                  <div className="animate-verified-icon flex size-14 items-center justify-center rounded-md bg-telkom-red text-white">
                    <Check className="size-7" strokeWidth={2.5} />
                  </div>
                  <p className="mt-4 text-lg font-semibold text-telkom-grey-900">Berhasil</p>
                </div>
              )}

              {error && step !== 4 && (
                <p className="mt-4 text-sm text-telkom-red">{error}</p>
              )}
            </div>
          </div>

          {step < 5 && (
            <div className="flex justify-end px-6 pb-6">
              {step === 1 && (
                <button
                  type="button"
                  className={wizardPrimaryBtnClass}
                  disabled={!canContinueStep1}
                  onClick={() => goTo(2)}
                >
                  Lanjut
                </button>
              )}

              {step === 2 && (
                <button type="button" className={wizardPrimaryBtnClass} onClick={() => goTo(3)}>
                  Lanjut
                </button>
              )}

              {step === 3 && (
                <button type="button" className={wizardPrimaryBtnClass} onClick={() => goTo(4)}>
                  Lanjut
                </button>
              )}

              {step === 4 && (
                <button
                  type="button"
                  className={wizardPrimaryBtnClass}
                  onClick={handleCreate}
                  disabled={submitting}
                >
                  {submitting ? "Membuat..." : "Buat Organisasi"}
                </button>
              )}
            </div>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
