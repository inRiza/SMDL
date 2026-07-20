import type { DocumentStatus, FileFormat, Document, DocumentCategory, DocumentSort } from "@prisma/client";

export type DocumentListQuery = {
    q?: string; // search query
    category?: DocumentCategory;
    status?: DocumentStatus;
    fileFormat?: FileFormat;
    sort?: DocumentSort;
    page?: number;
    limit?: number;
};

export type DocumentListItem = {
    id: string;
    title: string;
    description: string | null;
    category: string | null;
    status: DocumentStatus;
    createdAt: Date;
    updatedAt: Date;
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