"use client";

import { cn } from "@/lib/utils";
import type { OrganizationType } from "@/types/organization.types";
import { ORGANIZATION_TYPE_LABELS } from "@/types/organization.types";
import { CornerRedGridPair } from "@/components/app/corner-red-grid";

const STEPS = [
  { id: 1, label: "Identitas" },
  { id: 2, label: "Undang" },
  { id: 3, label: "Dokumen" },
  { id: 4, label: "Konfirmasi" },
] as const;

const typeOptions = Object.entries(ORGANIZATION_TYPE_LABELS) as [
  OrganizationType,
  string,
][];

export const wizardInputClass =
  "h-10 rounded-md border border-telkom-grey-300 bg-white px-4 text-sm text-telkom-grey-800 shadow-none outline-none placeholder:text-telkom-grey-400 focus-visible:ring-0 focus-visible:border-telkom-grey-300";

export const wizardTextareaClass =
  "min-h-28 w-full resize-none rounded-md border border-telkom-grey-300 bg-white px-4 py-3 text-sm text-telkom-grey-800 outline-none placeholder:text-telkom-grey-400 focus-visible:ring-0 focus-visible:border-telkom-grey-300";

export const wizardPrimaryBtnClass =
  "h-10 min-w-24 cursor-pointer rounded-md bg-telkom-red px-4 text-sm font-medium text-white transition-colors hover:bg-telkom-red-dark disabled:cursor-not-allowed disabled:bg-telkom-grey-200 disabled:text-telkom-grey-400";

export const wizardSecondaryBtnClass =
  "h-10 min-w-24 cursor-pointer rounded-md border border-telkom-grey-300 bg-white px-4 text-sm font-medium text-telkom-grey-700 transition-colors hover:bg-telkom-grey-50 disabled:cursor-not-allowed disabled:opacity-50";

export const wizardOutlineBtnClass =
  "size-10 shrink-0 cursor-pointer rounded-md border border-telkom-grey-300 bg-white text-telkom-grey-700 transition-colors hover:bg-telkom-grey-50";

type WizardFieldProps = {
  label: string;
  htmlFor?: string;
  required?: boolean;
  children: React.ReactNode;
};

export function WizardField({ label, htmlFor, required, children }: WizardFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className="text-sm font-medium text-telkom-grey-700">
        {label}
        {required && <span className="text-telkom-red"> *</span>}
      </label>
      {children}
    </div>
  );
}

type OrganizationTypePickerProps = {
  value: OrganizationType;
  onChange: (value: OrganizationType) => void;
};

export function OrganizationTypePicker({ value, onChange }: OrganizationTypePickerProps) {
  return (
    <WizardField label="Tipe organisasi">
      <div className="grid grid-cols-2 gap-2">
        {typeOptions.map(([typeValue, label]) => {
          const selected = value === typeValue;

          return (
            <button
              key={typeValue}
              type="button"
              onClick={() => onChange(typeValue)}
              className={cn(
                "group relative aspect-square cursor-pointer overflow-hidden rounded-md border text-left transition-colors",
                selected
                  ? "border-telkom-red bg-telkom-grey-50"
                  : "border-telkom-grey-200 bg-white hover:border-telkom-grey-300"
              )}
            >
              <CornerRedGridPair />
              <span
                className={cn(
                  "relative z-10 flex h-full items-end p-3 text-sm font-medium",
                  selected ? "text-telkom-grey-900" : "text-telkom-grey-700"
                )}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </WizardField>
  );
}

type WizardStepIndicatorProps = {
  currentStep: number;
};

export function WizardStepIndicator({ currentStep }: WizardStepIndicatorProps) {
  const visibleStep = Math.min(currentStep, STEPS.length);
  const progress = ((visibleStep - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        {STEPS.map((step) => {
          const isActive = step.id === visibleStep && currentStep <= STEPS.length;
          const isDone = step.id < visibleStep || currentStep > STEPS.length;

          return (
            <div key={step.id} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <div
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-md text-xs font-semibold transition-colors duration-200",
                  (isDone || isActive) && "bg-telkom-red text-white",
                  !isDone && !isActive && "bg-telkom-grey-100 text-telkom-grey-500"
                )}
              >
                {isDone ? "✓" : step.id}
              </div>
              <span
                className={cn(
                  "hidden truncate text-xs font-medium sm:block",
                  isActive ? "text-telkom-grey-900" : "text-telkom-grey-500"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="h-0.5 overflow-hidden rounded-full bg-telkom-grey-100">
        <div
          className="h-full rounded-full bg-telkom-red transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export function getWizardStepMeta(step: number) {
  switch (step) {
    case 1:
      return {
        title: "Buat organisasi baru",
        description: "Mulai dengan identitas organisasi. Nama wajib diisi.",
      };
    case 2:
      return {
        title: "Undang anggota",
        description: "Pilih pengguna terdaftar. Cari lewat nama atau email.",
      };
    case 3:
      return {
        title: "Unggah dokumen awal",
        description:
          "Opsional — tambahkan dokumen legal. LER berjalan otomatis setelah upload.",
      };
    case 4:
      return {
        title: "Konfirmasi",
        description: "Pastikan Anda siap menyimpan organisasi baru.",
      };
    case 5:
      return { title: "", description: "" };
    default:
      return { title: "", description: "" };
  }
}
