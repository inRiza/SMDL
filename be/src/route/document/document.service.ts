import { DocumentRepository } from "./document.repository";
import {
  mimeTypeForFormat,
  readStoredFile,
} from "@/lib/storage/file-storage";
import { resolveLerStatus } from "@/lib/ler/resolve-ler-status";
import type { DocumentListResponse } from "@/types/document.types";
import type {
  CreatePersonalDocumentWithFile,
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
    documentType: row.documentType,
    contentArea: row.contentArea,
    classification: row.classification,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    revision: row.revision,
    legalStatus: row.legalStatus,
    source: row.source,
    status: row.status,
    fileFormat: row.fileFormat,
    fileSizeBytes: row.fileSizeBytes.toString(),
    visibility: row.visibility,
    organizationId: row.organizationId,
    organizationName: row.organization?.name ?? null,
    ownerName: row.owner.name,
    canManage: row.organizationId === null,
    lerStatus: resolveLerStatus(row.status, row.lerExtractedAt),
    lerExtractedAt: row.lerExtractedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.createdAt.toISOString(),
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
        documentType: row.documentType,
        contentArea: row.contentArea,
        classification: row.classification,
        publishedAt: row.publishedAt?.toISOString() ?? null,
        revision: row.revision,
        legalStatus: row.legalStatus,
        source: row.source,
        status: row.status,
        fileFormat: row.fileFormat,
        fileSizeBytes: row.fileSizeBytes.toString(),
        visibility: row.visibility,
        organizationId: row.organizationId,
        organizationName: row.organization?.name ?? null,
        ownerName: row.owner.name,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.createdAt.toISOString(),
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

    const lerStatus = resolveLerStatus(result.status, result.lerExtractedAt);

    return {
      id: result.id,
      title: result.title,
      description: result.description,
      category: result.category,
      documentType: result.documentType,
      contentArea: result.contentArea,
      classification: result.classification,
      publishedAt: result.publishedAt?.toISOString() ?? null,
      revision: result.revision,
      legalStatus: result.legalStatus,
      source: result.source,
      status: result.status,
      fileFormat: result.fileFormat,
      fileSizeBytes: result.fileSizeBytes.toString(),
      visibility: result.visibility,
      organizationId: result.organizationId,
      organizationName: result.organization?.name ?? null,
      ownerName: result.owner.name,
      storageKey: result.storageKey,
      ownerId: result.ownerId,
      createdAt: result.createdAt.toISOString(),
      updatedAt: result.createdAt.toISOString(),
      lerStatus,
      lerExtractedAt: result.lerExtractedAt?.toISOString() ?? null,
      lerEntities: result.entities.map((entity) => ({
        id: entity.id,
        entityType: entity.entityType,
        entityValue: entity.entityValue,
        confidence: entity.confidence ?? 0,
      })),
      sections: result.sections.map((section) => ({
        id: section.id,
        orderIndex: section.orderIndex,
        blockType: section.blockType,
        headingLevel: section.headingLevel,
        pageNumber: section.pageNumber,
        content: section.content,
      })),
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
    input: CreatePersonalDocumentWithFile
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

  async getDocumentFile(id: string, userId?: string, inline = true) {
    const result = await this.repository.findById(id, userId);
    if (result === "forbidden") return "forbidden" as const;
    if (!result) return "not_found" as const;

    const buffer = await readStoredFile(result.storageKey);
    const fileName = `${result.title}.${result.fileFormat}`;

    return {
      buffer,
      fileName,
      mimeType: mimeTypeForFormat(result.fileFormat),
      inline,
    };
  }
}
