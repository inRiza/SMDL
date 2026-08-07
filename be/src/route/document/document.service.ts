import { DocumentRepository } from "./document.repository";
import type { DocumentListResponse } from "@/types/document.types";
import type {
  CreatePersonalDocumentInput,
  DocumentListQueryInput,
  UpdatePersonalDocumentInput,
} from "@/validators/document.validator";

function mapWorkspaceDocument(row: Awaited<
  ReturnType<DocumentRepository["getWorkspace"]>
>["documents"][number]) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    status: row.status,
    fileFormat: row.fileFormat,
    fileSizeBytes: row.fileSizeBytes.toString(),
    visibility: row.visibility,
    organizationId: row.organizationId,
    organizationName: row.organization?.name ?? null,
    canManage: row.organizationId === null,
    createdAt: row.createdAt.toISOString(),
  };
}

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

  async getWorkspace(userId: string) {
    const { user, documents, activities } = await this.repository.getWorkspace(userId);
    if (!user) return null;

    const canUpload = user.role === "owner" || user.role === "admin";

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      canUpload,
      documentCount: documents.length,
      documents: documents.map(mapWorkspaceDocument),
      activities: activities.map((activity) => ({
        id: activity.id,
        documentId: activity.documentId,
        actorId: activity.actorId,
        actorName: activity.actorName,
        action: activity.action,
        summary: activity.summary,
        metadata: activity.metadata,
        createdAt: activity.createdAt.toISOString(),
      })),
    };
  }

  async createPersonalDocument(
    userId: string,
    actorName: string,
    input: CreatePersonalDocumentInput
  ) {
    const document = await this.repository.createPersonalDocument(userId, actorName, input);
    return mapWorkspaceDocument(document);
  }

  async updatePersonalDocument(
    documentId: string,
    userId: string,
    actorName: string,
    input: UpdatePersonalDocumentInput
  ) {
    const result = await this.repository.updatePersonalDocument(
      documentId,
      userId,
      actorName,
      input
    );
    if (result === "not_found") return "not_found" as const;
    return mapWorkspaceDocument(result);
  }

  async revokePersonalDocument(documentId: string, userId: string, actorName: string) {
    return this.repository.revokePersonalDocument(documentId, userId, actorName);
  }
}
