export type DocumentStatus = "processing" | "ready" | "ler_failed";
export type FileFormat = "pdf" | "docx";
export type DocumentSort = "newest" | "oldest" | "title_asc" | "title_desc";

export type DocumentListItem = {
    id: string;
    title: string;
    description: string | null;
    category: string | null;
    fileFormat: FileFormat;
    fileSizeBytes: string;
    status: DocumentStatus;
    createdAt: string;
    updatedAt: string;
};

export type DocumentListResponse = {
    data: DocumentListItem[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
};

export type DocumentFilters = {
    q?: string;
    category?: string;
    status?: DocumentStatus;
    fileFormat?: FileFormat;
    sort?: DocumentSort;
    page?: number;
    limit?: number;
};