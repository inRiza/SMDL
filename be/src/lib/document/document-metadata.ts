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

export type DocumentMetadataInput = {
  documentType?: string;
  contentArea?: string;
  classification?: string;
  publishedAt?: string;
  revision?: string;
  legalStatus?: string;
  source?: string;
};

export function parseDocumentMetadata(formData: FormData): DocumentMetadataInput {
  const read = (key: string) => {
    const value = formData.get(key);
    if (value == null) return undefined;
    const text = String(value).trim();
    return text || undefined;
  };

  return {
    documentType: read("documentType"),
    contentArea: read("contentArea"),
    classification: read("classification"),
    publishedAt: read("publishedAt"),
    revision: read("revision"),
    legalStatus: read("legalStatus"),
    source: read("source"),
  };
}

export function parsePublishedAt(value?: string) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Tanggal terbit tidak valid");
  }
  return date;
}
