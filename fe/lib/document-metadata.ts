export const DOCUMENT_CLASSIFICATIONS = [
  { value: "internal_policy", label: "Kebijakan Internal" },
  { value: "external_regulation", label: "Peraturan Eksternal" },
] as const;

export const DOCUMENT_TYPES = [
  { value: "peraturan_direksi", label: "Peraturan direksi" },
  { value: "peraturan_direktur", label: "Peraturan direktur" },
  { value: "peraturan_kepala_unit", label: "Peraturan kepala unit" },
  { value: "surat_keputusan", label: "Surat keputusan" },
  { value: "charter", label: "Charter" },
  { value: "nota_dinas_elektronik", label: "Nota dinas elektronik" },
  { value: "keputusan_dewan_komisaris", label: "Keputusan dewan komisaris" },
] as const;

export const CONTENT_AREAS = [
  { value: "strategi", label: "Strategi" },
  { value: "human_capital", label: "Human Capital" },
  { value: "keuangan", label: "Keuangan" },
  { value: "infrastruktur", label: "Infrastruktur" },
  { value: "customer_marketing", label: "Customer Marketing" },
  { value: "enterprise_management", label: "Enterprise Management" },
  { value: "stakeholder_management", label: "Stakeholder Management" },
] as const;

export const LEGAL_STATUSES = [
  { value: "active", label: "Berlaku" },
  { value: "inactive", label: "Tidak berlaku" },
] as const;

export const DOCUMENT_SOURCES = [
  { value: "internal", label: "Internal" },
  { value: "external", label: "Eksternal" },
] as const;

export const AI_SUMMARY_FIELDS = [
  { key: "ditetapkanOleh", label: "Ditetapkan oleh" },
  { key: "ditandatanganiOleh", label: "Di-TTD oleh" },
  { key: "tujuan", label: "Tujuan" },
  { key: "proses", label: "Proses" },
  { key: "tanggungJawab", label: "Tanggung jawab" },
  { key: "efektifSejak", label: "Efektif sejak" },
  { key: "hubunganPeraturan", label: "Hubungan dengan Peraturan Lain" },
] as const;

export type DocumentClassification =
  (typeof DOCUMENT_CLASSIFICATIONS)[number]["value"];
export type DocumentTypeValue = (typeof DOCUMENT_TYPES)[number]["value"];
export type ContentAreaValue = (typeof CONTENT_AREAS)[number]["value"];
export type LegalStatusValue = (typeof LEGAL_STATUSES)[number]["value"];
export type DocumentSourceValue = (typeof DOCUMENT_SOURCES)[number]["value"];

export function labelForOption<T extends { value: string; label: string }>(
  options: readonly T[],
  value: string | null | undefined,
) {
  if (!value) return "—";
  return options.find((item) => item.value === value)?.label ?? value;
}

export function formatPublishedDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}
