"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@base-ui/react/dialog";
import { Check, ChevronLeft, FileUp, Plus, Upload, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createOrganization,
  inviteOrganizationMembers,
} from "@/lib/api/organization/route";
import type {
  OrganizationAccessLevel,
  OrganizationInviteInput,
  OrganizationListItem,
  OrganizationType,
} from "@/types/organization.types";
import { ORGANIZATION_ACCESS_LABELS } from "@/types/organization.types";
import { cn } from "@/lib/utils";
import { useOrganizationSearch } from "./organization-search-provider";
import {
  OrganizationTypePicker,
  WizardField,
  WizardStepIndicator,
  getWizardStepMeta,
  wizardInputClass,
  wizardOutlineBtnClass,
  wizardPrimaryBtnClass,
  wizardTextareaClass,
} from "./wizard-step-indicator";

const accessOptions: OrganizationAccessLevel[] = ["member", "viewer"];

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

export function AddNewOrganization() {
  const router = useRouter();
  const { refresh } = useOrganizationSearch();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const successTimerRef = useRef<number | null>(null);

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [form, setForm] = useState(initialForm);
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteAccess, setInviteAccess] = useState<OrganizationAccessLevel>("member");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [summary, setSummary] = useState<WizardSummary | null>(null);

  const stepMeta = getWizardStepMeta(step);
  const canContinueStep1 = form.name.trim().length >= 2;
  const showBack = step > 1 && step < 5;

  function resetWizard() {
    if (successTimerRef.current) {
      clearTimeout(successTimerRef.current);
      successTimerRef.current = null;
    }

    setStep(1);
    setDirection("forward");
    setForm(initialForm);
    setInvites([]);
    setInviteEmail("");
    setInviteAccess("member");
    setFiles([]);
    setError(null);
    setSubmitting(false);
    setSummary(null);
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

  function addInvite() {
    const email = inviteEmail.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Masukkan email yang valid");
      return;
    }

    if (invites.some((item) => item.email === email)) {
      setError("Email sudah ada di daftar undangan");
      return;
    }

    setInvites((prev) => [
      ...prev,
      { key: crypto.randomUUID(), email, accessLevel: inviteAccess },
    ]);
    setInviteEmail("");
    setError(null);
  }

  function removeInvite(key: string) {
    setInvites((prev) => prev.filter((item) => item.key !== key));
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
          invites.map(({ email, accessLevel }) => ({ email, accessLevel }))
        );
        inviteCount = sent.length;
      }

      const nextSummary = {
        organization,
        inviteCount,
        pendingUploadCount: files.length,
      };

      setSummary(nextSummary);
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
            className="shrink-0 cursor-pointer gap-1.5 rounded-none border-telkom-grey-200"
          />
        }
      >
        <Plus className="size-3.5" />
        <span className="hidden sm:inline">Buat Organisasi</span>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px] transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0" />

        <Dialog.Popup className="animate-wizard-scale-in fixed top-1/2 left-1/2 z-50 flex max-h-[min(720px,92vh)] w-[min(560px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xs border border-telkom-grey-200 bg-white shadow-2xl outline-none">
          {step < 5 && (
          <div className="relative border-b border-telkom-grey-200 px-6 pt-4 pb-3">
            {showBack && (
              <button
                type="button"
                onClick={() => goTo(step - 1)}
                disabled={submitting}
                className="absolute top-4 left-4 flex cursor-pointer items-center gap-1 rounded-none px-1 py-1 text-sm text-telkom-grey-600 transition-colors hover:text-telkom-black disabled:opacity-50"
              >
                <ChevronLeft className="size-4" />
                Kembali
              </button>
            )}

            <div className={cn(showBack && "pt-6")}>
              <WizardStepIndicator currentStep={step} />
            </div>
          </div>
          )}

          {step < 5 && (
          <div className="border-b border-telkom-grey-200 px-6 py-4">
            <Dialog.Title className="text-lg font-semibold text-telkom-black">
              {stepMeta.title}
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-telkom-grey-600">
              {stepMeta.description}
            </Dialog.Description>
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
                  <WizardField label="Email anggota">
                    <div className="grid grid-cols-[minmax(0,1fr)_7.5rem_2.5rem] gap-2">
                      <Input
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="email@telkom.co.id"
                        className={wizardInputClass}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addInvite();
                          }
                        }}
                      />
                      <select
                        value={inviteAccess}
                        onChange={(e) =>
                          setInviteAccess(e.target.value as OrganizationAccessLevel)
                        }
                        className={cn(wizardInputClass, "px-2")}
                      >
                        {accessOptions.map((level) => (
                          <option key={level} value={level}>
                            {ORGANIZATION_ACCESS_LABELS[level]}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={addInvite}
                        className={wizardOutlineBtnClass}
                        aria-label="Tambah undangan"
                      >
                        <UserPlus className="mx-auto size-4" />
                      </button>
                    </div>
                  </WizardField>

                  {invites.length === 0 ? (
                    <div className="rounded-xs border border-dashed border-telkom-grey-200 bg-telkom-grey-50 px-4 py-8 text-center">
                      <p className="text-sm font-medium text-telkom-black">
                        Belum ada undangan
                      </p>
                      <p className="mt-1 text-xs text-telkom-grey-600">
                        Tambahkan email pengguna terdaftar. Undangan menunggu konfirmasi
                        accept/decline.
                      </p>
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {invites.map((invite) => (
                        <li
                          key={invite.key}
                          className="flex items-center justify-between rounded-xs border border-telkom-grey-200 px-3 py-2"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-telkom-black">
                              {invite.email}
                            </p>
                            <p className="text-xs text-telkom-grey-500">
                              {ORGANIZATION_ACCESS_LABELS[invite.accessLevel ?? "member"]} ·
                              Menunggu
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeInvite(invite.key)}
                            className="cursor-pointer rounded-none p-1 text-telkom-grey-500 hover:bg-telkom-grey-100 hover:text-telkom-red"
                          >
                            <X className="size-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
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
                    className="flex w-full cursor-pointer flex-col items-center justify-center rounded-xs border border-dashed border-telkom-grey-200 bg-telkom-grey-50 px-4 py-10 transition-colors hover:border-telkom-red/30 hover:bg-white"
                  >
                    <div className="flex size-12 items-center justify-center rounded-xs bg-telkom-red/10 text-telkom-red">
                      <Upload className="size-5" />
                    </div>
                    <p className="mt-3 text-sm font-medium text-telkom-black">
                      Seret atau klik untuk memilih file
                    </p>
                    <p className="mt-1 text-xs text-telkom-grey-500">
                      PDF atau DOCX · opsional
                    </p>
                  </button>

                  {files.length > 0 && (
                    <ul className="space-y-2">
                      {files.map((file, index) => (
                        <li
                          key={`${file.name}-${index}`}
                          className="flex items-center justify-between rounded-xs border border-telkom-grey-200 px-3 py-2"
                        >
                          <div className="flex min-w-0 items-center gap-2">
                            <FileUp className="size-4 shrink-0 text-telkom-grey-500" />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-telkom-black">
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
                            className="cursor-pointer rounded-none p-1 text-telkom-grey-500 hover:bg-telkom-grey-100 hover:text-telkom-red"
                          >
                            <X className="size-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  <p className="rounded-xs bg-telkom-grey-50 px-3 py-2 text-xs leading-relaxed text-telkom-grey-600">
                    File yang dipilih akan siap diunggah ke ruang organisasi. Upload penuh dan
                    ekstraksi LER otomatis akan tersedia dari halaman organisasi setelah pembuatan
                    selesai.
                  </p>
                </div>
              )}

              {step === 4 && (
                <div className="flex min-h-40 flex-col items-center justify-center text-center">
                  <p className="max-w-sm text-base leading-relaxed text-telkom-black">
                    Apakah Anda yakin ingin menyimpan dan membuat organisasi ini?
                  </p>
                  <p className="mt-2 max-w-sm text-sm text-telkom-grey-600">
                    Anda akan otomatis menjadi Owner organisasi.
                  </p>
                </div>
              )}

              {step === 5 && summary && (
                <div className="flex min-h-64 flex-col items-center justify-center text-center">
                  <div className="animate-verified-icon flex size-16 items-center justify-center rounded-full bg-telkom-red text-white">
                    <Check className="size-8" strokeWidth={2.5} />
                  </div>
                  <p className="mt-5 text-lg font-semibold text-telkom-black">
                    Berhasil
                  </p>
                </div>
              )}

              {error && step !== 4 && (
                <p className="mt-4 text-sm text-telkom-red">{error}</p>
              )}
            </div>
          </div>

          {step < 5 && (
          <div className="flex justify-end border-t border-telkom-grey-200 px-6 py-4">
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
              <button
                type="button"
                className={wizardPrimaryBtnClass}
                onClick={() => goTo(4)}
              >
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
