import type { Prisma } from "@prisma/client";
import { prismaClient } from "@/lib/db/prisma";
import {
  buildDocumentAccessWhere,
  canAccessDocument,
  getAccessibleOrganizationIds,
} from "@/lib/document/document-access";
import type { DocumentListQueryInput } from "@/validators/document.validator";

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
  fileFormat: true,
  fileSizeBytes: true,
  status: true,
  visibility: true,
  organizationId: true,
  createdAt: true,
} as const;

const detailSelect = {
  ...listSelect,
  storageKey: true,
  ownerId: true,
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
}
