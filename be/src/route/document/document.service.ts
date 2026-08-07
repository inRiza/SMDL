import { DocumentRepository } from "./document.repository";
import type { DocumentListResponse } from "@/types/document.types";
import type { DocumentListQueryInput } from "@/validators/document.validator";

export class DocumentService {
  constructor(private readonly repository: DocumentRepository = new DocumentRepository()) {}

  async listDocuments(
    query: DocumentListQueryInput,
    userId?: string
  ): Promise<DocumentListResponse> {
    const { rows, total } = await this.repository.findMany(query, userId);

    return {
      data: rows.map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        category: row.category,
        status: row.status,
        fileFormat: row.fileFormat,
        fileSizeBytes: row.fileSizeBytes.toString(),
        visibility: row.visibility,
        organizationId: row.organizationId,
        createdAt: row.createdAt,
        updatedAt: row.createdAt,
      })),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async listCategories(userId?: string) {
    return this.repository.findCategories(userId);
  }

  async getDocumentById(id: string, userId?: string) {
    const result = await this.repository.findById(id, userId);
    if (result === "forbidden") return "forbidden" as const;
    if (!result) return null;

    return {
      id: result.id,
      title: result.title,
      description: result.description,
      category: result.category,
      status: result.status,
      fileFormat: result.fileFormat,
      fileSizeBytes: result.fileSizeBytes.toString(),
      visibility: result.visibility,
      organizationId: result.organizationId,
      storageKey: result.storageKey,
      ownerId: result.ownerId,
      createdAt: result.createdAt.toISOString(),
      updatedAt: result.createdAt.toISOString(),
    };
  }
}
