import type { DocumentListResponse, DocumentFilters } from "@/types/document.types";
import { apiBeDocuments } from "../api.be";

function buildQuery(filters: DocumentFilters): string {
    const param = new URLSearchParams();

    Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== "") {
            param.set(k, v as string);
        }
    });

    return param.toString();
}

export async function fetchDocuments(filters: DocumentFilters = {}): Promise<DocumentListResponse> {
    const query = buildQuery(filters);
    const res = await fetch(`${apiBeDocuments}?${query}`, {
        cache: "no-store",
    });

    if (!res.ok) {
        throw new Error(`Failed to fetch documents: ${res.statusText}`);
    }

    return res.json();
}

export async function fetchDocumentCategories(): Promise<string[]> {
    const res = await fetch(`${apiBeDocuments}/categories`, {
        cache: "no-store",
    });

    if (!res.ok) {
        throw new Error(`Failed to fetch document categories: ${res.statusText}`);
    }

    const json = await res.json();
    return json.data as string[];
}