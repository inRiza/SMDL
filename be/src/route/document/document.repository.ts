import type { Prisma } from "@prisma/client";
import { prismaClient } from "@/lib/db/prisma";
import type { DocumentListQueryInput } from "@/validators/document.validator";

function buildWhere(query: DocumentListQueryInput): Prisma.DocumentWhereInput {
    const where: Prisma.DocumentWhereInput = {};

    if (query.q) {
        where.OR = [
            { title: { contains: query.q, mode: "insensitive" } },
            { description: { contains: query.q, mode: "insensitive" } },
        ];
    }

    if (query.category) {
        where.category = { equals: query.category, mode: "insensitive" };
    }

    if (query.status) {
        where.status = query.status;
    }

    if (query.fileFormat) {
        where.fileFormat = query.fileFormat;
    }

    return where;
}

function buildOrderBy(sort: DocumentListQueryInput["sort"]): Prisma.DocumentOrderByWithRelationInput {
    switch (sort) {
        case "oldest":
            return { createdAt: "asc" };
        case "title_asc":
            return { title: "asc" };
        case "title_desc":
            return { title: "desc" };
        default: // newest
            return { createdAt: "desc" };
    }
}

export class DocumentRepository {
    async findMany(query: DocumentListQueryInput) {
        const where = buildWhere(query);
        const orderBy = buildOrderBy(query.sort);
        const skip = (query.page - 1) * query.limit;

        const [rows, total] = await Promise.all([
            prismaClient.document.findMany({
                where,
                orderBy,
                skip,
                take: query.limit,
                select: {
                    id: true,
                    title: true,
                    description: true,
                    category: true,
                    fileFormat: true,
                    fileSizeBytes: true,
                    status: true,
                    createdAt: true,
                },
            }),
            prismaClient.document.count({ where }),
        ]);
        
        return { rows, total };
    }

    async findCategories() {
        const rows = await prismaClient.document.findMany({
            where: { category: { not: null } },
            select: { category: true },
            distinct: ["category"],
            orderBy: { category: "asc" },
        });

        return rows.map((row) => row.category).filter((category): category is string => Boolean(category));
    }
}