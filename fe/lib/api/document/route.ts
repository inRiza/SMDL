import type {
  DocumentDetail,
  DocumentFilters,
  DocumentListResponse,
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
