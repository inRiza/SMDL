import type {
  DocumentDetail,
  DocumentFilters,
  DocumentListResponse,
  DocumentLerStatus,
  DocumentWorkspace,
  WorkspaceDocumentItem,
} from "@/types/document.types";
import { getApiBeDocuments } from "../api.be";
import { fetchApi } from "../fetch-api";

function buildQuery(filters: DocumentFilters): string {
  const param = new URLSearchParams();

  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== "") {
      param.set(k, v as string);
    }
  });

  return param.toString();
}

function mapDocumentDetail(document: Record<string, unknown>): DocumentDetail {
  return {
    id: String(document.id),
    title: String(document.title),
    description: (document.description as string | null) ?? null,
    category: (document.category as string | null) ?? null,
    documentType: (document.documentType as string | null) ?? null,
    contentArea: (document.contentArea as string | null) ?? null,
    classification: (document.classification as string | null) ?? null,
    publishedAt: (document.publishedAt as string | null) ?? null,
    revision: (document.revision as string | null) ?? null,
    legalStatus: (document.legalStatus as string | null) ?? null,
    source: (document.source as string | null) ?? null,
    fileFormat: document.fileFormat as DocumentDetail["fileFormat"],
    fileSizeBytes: String(document.fileSizeBytes),
    status: document.status as DocumentDetail["status"],
    visibility: document.visibility as DocumentDetail["visibility"],
    organizationId: (document.organizationId as string | null) ?? null,
    organizationName: (document.organizationName as string | null) ?? null,
    ownerName: String(document.ownerName ?? "—"),
    createdAt: String(document.createdAt),
    updatedAt: String(document.updatedAt ?? document.createdAt),
    storageKey: String(document.storageKey),
    ownerId: String(document.ownerId),
    lerStatus:
      (document.lerStatus as DocumentDetail["lerStatus"]) ??
      (document.status === "processing"
        ? "pending"
        : document.status === "ler_failed"
          ? "failed"
          : document.lerExtractedAt
            ? "completed"
            : "idle"),
    lerEntities: (document.lerEntities as DocumentDetail["lerEntities"]) ?? [],
    lerExtractedAt: (document.lerExtractedAt as string | null) ?? null,
    sections: (document.sections as DocumentDetail["sections"]) ?? [],
  };
}

export async function fetchDocuments(
  filters: DocumentFilters = {}
): Promise<DocumentListResponse> {
  const query = buildQuery(filters);
  const res = await fetchApi(`${getApiBeDocuments()}?${query}`);

  if (!res.ok) {
    throw new Error(`Failed to fetch documents: ${res.statusText}`);
  }

  return res.json();
}

export async function fetchDocumentCategories(): Promise<string[]> {
  const res = await fetchApi(`${getApiBeDocuments()}/categories`);

  if (!res.ok) {
    throw new Error(`Failed to fetch document categories: ${res.statusText}`);
  }

  const json = await res.json();
  return json.data as string[];
}

export async function fetchDocumentById(id: string): Promise<DocumentDetail | null> {
  const res = await fetchApi(`${getApiBeDocuments()}/${id}`);

  if (res.status === 403 || res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Failed to fetch document: ${res.statusText}`);
  }

  const document = await res.json();
  return mapDocumentDetail(document);
}

export async function fetchDocumentLerStatus(id: string): Promise<DocumentLerStatus> {
  const res = await fetchApi(`${getApiBeDocuments()}/${id}/ler`);

  if (!res.ok) {
    throw new Error(`Failed to fetch LER status: ${res.statusText}`);
  }

  return res.json();
}

export async function generateDocumentLer(id: string) {
  const res = await fetchApi(`${getApiBeDocuments()}/${id}/ler/generate`, {
    method: "POST",
  });

  if (res.status === 409) {
    throw new Error("Ekstraksi LER sedang berjalan");
  }

  if (!res.ok) {
    throw new Error(await readError(res, "Gagal memulai ekstraksi LER"));
  }
}

export async function retryDocumentLer(id: string) {
  return generateDocumentLer(id);
}

async function readError(res: Response, fallback: string) {
  const data = (await res.json().catch(() => null)) as {
    error?: string;
    details?: Record<string, string[]>;
  } | null;
  return data?.details?.title?.[0] ?? data?.error ?? fallback;
}

export function getDocumentFileUrl(id: string) {
  return `/backend-api/documents/${id}/file?inline=1`;
}

export function getDocumentDownloadUrl(id: string) {
  return `/backend-api/documents/${id}/file?inline=0`;
}

export async function fetchDocumentWorkspace(): Promise<DocumentWorkspace> {
  const res = await fetchApi(`${getApiBeDocuments()}/workspace`);

  if (res.status === 401) {
    throw new Error("Sesi berakhir. Silakan login ulang.");
  }

  if (!res.ok) {
    throw new Error(await readError(res, "Gagal memuat workspace dokumen"));
  }

  return res.json();
}

export async function uploadPersonalDocument(input: {
  title: string;
  description?: string;
  documentType?: string;
  contentArea?: string;
  classification?: string;
  publishedAt?: string;
  revision?: string;
  legalStatus?: string;
  source?: string;
  file: File;
}): Promise<WorkspaceDocumentItem> {
  const formData = new FormData();
  formData.set("title", input.title);
  if (input.description) formData.set("description", input.description);
  if (input.documentType) formData.set("documentType", input.documentType);
  if (input.contentArea) formData.set("contentArea", input.contentArea);
  if (input.classification) formData.set("classification", input.classification);
  if (input.publishedAt) formData.set("publishedAt", input.publishedAt);
  if (input.revision) formData.set("revision", input.revision);
  if (input.legalStatus) formData.set("legalStatus", input.legalStatus);
  if (input.source) formData.set("source", input.source);
  formData.set("file", input.file);

  const res = await fetchApi(getApiBeDocuments(), {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error(await readError(res, "Gagal mengunggah dokumen"));
  }

  return res.json();
}

export async function updatePersonalDocument(
  documentId: string,
  input: { title?: string; category?: string | null }
): Promise<WorkspaceDocumentItem> {
  const res = await fetchApi(`${getApiBeDocuments()}/${documentId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    throw new Error(await readError(res, "Gagal memperbarui dokumen"));
  }

  return res.json();
}

export async function revokePersonalDocument(documentId: string) {
  const res = await fetchApi(`${getApiBeDocuments()}/${documentId}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    throw new Error(await readError(res, "Gagal mencabut dokumen"));
  }
}

export function getDocumentLerStreamUrl(id: string) {
  if (typeof window !== "undefined") {
    return `/backend-api/documents/${id}/ler/stream`;
  }
  const internal = process.env.API_INTERNAL_URL ?? "http://localhost:3001";
  return `${internal}/api/documents/${id}/ler/stream`;
}
