import { DocumentRepository } from "./document.repository";
import type { DocumentListResponse } from "@/types/document.types";
import type { DocumentListQueryInput } from "@/validators/document.validator";

export class DocumentService {
    constructor(private readonly repository: DocumentRepository = new DocumentRepository()) {}

    async listDocuments(query: DocumentListQueryInput): Promise<DocumentListResponse> {
        const { rows, total } = await this.repository.findMany(query);

        return {
            data: rows.map((row) => ({
                id: row.id,
                title: row.title,
                description: row.description,
                category: row.category,
                status: row.status,
                fileFormat: row.fileFormat,
                fileSizeBytes: row.fileSizeBytes.toString(),
                createdAt: row.createdAt,
                updatedAt: row.createdAt, // TODO: update this when the document is updated
            })),
            meta: {
                page: query.page,
                limit: query.limit,
                total,
                totalPages: Math.ceil(total / query.limit),
            },
        };
    }

    async listCategories() {
        return this.repository.findCategories();
    }
}