import type { Prisma } from "@prisma/client";
import { prismaClient } from "@/lib/db/prisma";
import { recordDocumentActivity } from "@/lib/document/document-activity-log";
import { buildStorageKey, deleteStoredFile, saveFile } from "@/lib/storage/file-storage";
import {
  buildDocumentAccessWhere,
  canAccessDocument,
  getAccessibleOrganizationIds,
} from "@/lib/document/document-access";
import type {
  CreatePersonalDocumentWithFile,
  DocumentListQueryInput,
  UpdatePersonalDocumentInput,
} from "@/validators/document.validator";

function buildWhere(
  query: DocumentListQueryInput,
  accessWhere: Prisma.DocumentWhereInput
): Prisma.DocumentWhereInput {
  const where: Prisma.DocumentWhereInput = {
    AND: [accessWhere],
  };

  if (query.q) {
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : [where.AND]),
      {
        OR: [
          { title: { contains: query.q, mode: "insensitive" } },
          { description: { contains: query.q, mode: "insensitive" } },
        ],
      },
    ];
  }

  if (query.category) {
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : [where.AND]),
      { category: { equals: query.category, mode: "insensitive" } },
    ];
  }

  if (query.classification) {
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : [where.AND]),
      { classification: query.classification },
    ];
  }

  if (query.documentType) {
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : [where.AND]),
      { documentType: query.documentType },
    ];
  }

  if (query.contentArea) {
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : [where.AND]),
      { contentArea: query.contentArea },
    ];
  }

  if (query.status) {
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : [where.AND]),
      { status: query.status },
    ];
  }

  if (query.fileFormat) {
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : [where.AND]),
      { fileFormat: query.fileFormat },
    ];
  }

  return where;
}

function buildOrderBy(
  sort: DocumentListQueryInput["sort"]
): Prisma.DocumentOrderByWithRelationInput {
  switch (sort) {
    case "oldest":
      return { createdAt: "asc" };
    case "title_asc":
      return { title: "asc" };
    case "title_desc":
      return { title: "desc" };
    default:
      return { createdAt: "desc" };
  }
}

const listSelect = {
  id: true,
  title: true,
  description: true,
  category: true,
  documentType: true,
  contentArea: true,
  classification: true,
  publishedAt: true,
  revision: true,
  legalStatus: true,
  source: true,
  fileFormat: true,
  fileSizeBytes: true,
  status: true,
  visibility: true,
  organizationId: true,
  createdAt: true,
  owner: {
    select: {
      id: true,
      name: true,
    },
  },
  organization: {
    select: {
      id: true,
      name: true,
    },
  },
} as const;

const detailSelect = {
  ...listSelect,
  storageKey: true,
  ownerId: true,
  lerExtractedAt: true,
  entities: {
    select: {
      id: true,
      entityType: true,
      entityValue: true,
      confidence: true,
      sourceText: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" as const },
  },
  sections: {
    select: {
      id: true,
      orderIndex: true,
      blockType: true,
      headingLevel: true,
      pageNumber: true,
      content: true,
    },
    orderBy: { orderIndex: "asc" as const },
  },
} as const;

const workspaceDocumentSelect = {
  id: true,
  title: true,
  description: true,
  category: true,
  documentType: true,
  contentArea: true,
  classification: true,
  publishedAt: true,
  revision: true,
  legalStatus: true,
  source: true,
  fileFormat: true,
  fileSizeBytes: true,
  status: true,
  visibility: true,
  organizationId: true,
  lerExtractedAt: true,
  createdAt: true,
  owner: {
    select: {
      id: true,
      name: true,
    },
  },
  organization: {
    select: {
      id: true,
      name: true,
    },
  },
} as const;

const activitySelect = {
  id: true,
  documentId: true,
  actorId: true,
  actorName: true,
  action: true,
  summary: true,
  metadata: true,
  createdAt: true,
} as const;

export class DocumentRepository {
  async findMany(query: DocumentListQueryInput, userId?: string) {
    const orgIds = userId ? await getAccessibleOrganizationIds(userId) : new Set<string>();
    const accessWhere = buildDocumentAccessWhere(userId, orgIds);
    const where = buildWhere(query, accessWhere);
    const orderBy = buildOrderBy(query.sort);
    const skip = (query.page - 1) * query.limit;

    const [rows, total] = await Promise.all([
      prismaClient.document.findMany({
        where,
        orderBy,
        skip,
        take: query.limit,
        select: listSelect,
      }),
      prismaClient.document.count({ where }),
    ]);

    return { rows, total };
  }

  async findCategories(userId?: string) {
    const orgIds = userId ? await getAccessibleOrganizationIds(userId) : new Set<string>();
    const accessWhere = buildDocumentAccessWhere(userId, orgIds);

    const rows = await prismaClient.document.findMany({
      where: {
        AND: [accessWhere, { category: { not: null } }],
      },
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
    });

    return rows.map((row) => row.category).filter((category): category is string => Boolean(category));
  }

  async findById(id: string, userId?: string) {
    const document = await prismaClient.document.findUnique({
      where: { id },
      select: detailSelect,
    });

    if (!document) return null;

    const allowed = await canAccessDocument(userId, document);
    if (!allowed) return "forbidden" as const;

    return document;
  }

  async getWorkspace(userId: string) {
    const [user, documents, activities] = await Promise.all([
      prismaClient.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, role: true },
      }),
      prismaClient.document.findMany({
        where: { ownerId: userId },
        orderBy: { createdAt: "desc" },
        select: workspaceDocumentSelect,
      }),
      prismaClient.documentActivity.findMany({
        where: {
          OR: [
            { document: { ownerId: userId } },
            { actorId: userId },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 100,
        select: activitySelect,
      }),
    ]);

    return { user, documents, activities };
  }

  async createPersonalDocument(
    ownerId: string,
    actorName: string,
    input: CreatePersonalDocumentWithFile
  ) {
    const storageKey = buildStorageKey(`personal/${ownerId}`, input.fileName);
    await saveFile(storageKey, input.fileBuffer);

    const document = await prismaClient.document.create({
      data: {
        title: input.title,
        description: input.description,
        category: input.category,
        documentType: input.documentType,
        contentArea: input.contentArea,
        classification: input.classification,
        publishedAt: input.publishedAt,
        revision: input.revision,
        legalStatus: input.legalStatus,
        source: input.source,
        fileFormat: input.fileFormat,
        fileSizeBytes: BigInt(input.fileSizeBytes),
        status: "ready",
        visibility: "public",
        storageKey,
        ownerId,
        organizationId: null,
      },
      select: workspaceDocumentSelect,
    });

    await recordDocumentActivity({
      documentId: document.id,
      actorId: ownerId,
      actorName,
      action: "document.uploaded",
      summary: `mengunggah dokumen “${document.title}” (${document.fileFormat.toUpperCase()}, publik)`,
      metadata: { documentId: document.id, title: document.title, visibility: "public" },
    });

    return document;
  }

  async updatePersonalDocument(
    documentId: string,
    ownerId: string,
    actorName: string,
    input: UpdatePersonalDocumentInput
  ) {
    const existing = await prismaClient.document.findFirst({
      where: { id: documentId, ownerId, organizationId: null },
      select: { id: true, title: true },
    });
    if (!existing) return "not_found" as const;

    const updated = await prismaClient.document.update({
      where: { id: documentId },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.category !== undefined ? { category: input.category } : {}),
      },
      select: workspaceDocumentSelect,
    });

    const summary =
      input.title && input.title !== existing.title
        ? `mengganti nama dokumen “${existing.title}” → “${input.title}”`
        : `memperbarui dokumen “${existing.title}”`;

    await recordDocumentActivity({
      documentId,
      actorId: ownerId,
      actorName,
      action: "document.updated",
      summary,
      metadata: { documentId, ...input },
    });

    return updated;
  }

  async revokePersonalDocument(documentId: string, ownerId: string, actorName: string) {
    const existing = await prismaClient.document.findFirst({
      where: { id: documentId, ownerId, organizationId: null },
      select: { id: true, title: true, storageKey: true },
    });
    if (!existing) return "not_found" as const;

    await recordDocumentActivity({
      documentId,
      actorId: ownerId,
      actorName,
      action: "document.revoked",
      summary: `mencabut/menghapus dokumen “${existing.title}”`,
      metadata: { documentId, title: existing.title },
    });

    await prismaClient.$transaction([
      prismaClient.documentEntity.deleteMany({ where: { documentId } }),
      prismaClient.documentChunk.deleteMany({ where: { documentId } }),
      prismaClient.documentSection.deleteMany({ where: { documentId } }),
      prismaClient.document.delete({ where: { id: documentId } }),
    ]);
    await deleteStoredFile(existing.storageKey);
    return "ok" as const;
  }

  async findEntities(documentId: string) {
    return prismaClient.documentEntity.findMany({
      where: { documentId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        entityType: true,
        entityValue: true,
        confidence: true,
        sourceText: true,
        createdAt: true,
      },
    });
  }

  async startLerGeneration(
    documentId: string,
    ownerId: string,
    options: { force?: boolean } = {}
  ) {
    const document = await prismaClient.document.findFirst({
      where: { id: documentId, ownerId },
      select: { id: true, status: true, title: true },
    });
    if (!document) return "not_found" as const;
    if (document.status === "processing" && !options.force) {
      return "already_processing" as const;
    }

    await prismaClient.$transaction([
      prismaClient.documentEntity.deleteMany({ where: { documentId } }),
      prismaClient.documentChunk.deleteMany({ where: { documentId } }),
      prismaClient.documentSection.deleteMany({ where: { documentId } }),
      prismaClient.document.update({
        where: { id: documentId },
        data: { status: "processing", lerExtractedAt: null },
      }),
    ]);

    const { triggerLerExtraction } = await import("@/lib/ler/trigger-ler");
    await triggerLerExtraction(documentId);
    return "ok" as const;
  }

  async resetForLerRetry(documentId: string, ownerId: string) {
    return this.startLerGeneration(documentId, ownerId);
  }
}
