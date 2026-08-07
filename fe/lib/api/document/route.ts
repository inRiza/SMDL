import type {
  DocumentDetail,
  DocumentFilters,
  DocumentListResponse,
  DocumentWorkspace,
  WorkspaceDocumentItem,
} from "@/types/document.types";
import { toDocumentDetail } from "@/lib/mock/document-ler";
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
  return toDocumentDetail({
    ...document,
    updatedAt: document.updatedAt ?? document.createdAt,
  });
}

async function readError(res: Response, fallback: string) {
  const data = (await res.json().catch(() => null)) as {
    error?: string;
    details?: Record<string, string[]>;
  } | null;
  return data?.details?.title?.[0] ?? data?.error ?? fallback;
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
  category?: string;
  fileFormat: "pdf" | "docx";
  fileSizeBytes?: number;
}): Promise<WorkspaceDocumentItem> {
  const res = await fetchApi(getApiBeDocuments(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
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
