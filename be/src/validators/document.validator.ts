import { z } from "zod";
import { DocumentStatus, FileFormat, DocumentSort } from "@prisma/client";

export const DocumentListQuerySchema = z.object({
    q: z.string().trim().optional(),
    category: z.string().trim().optional(),
    status: z.nativeEnum(DocumentStatus).optional(),
    fileFormat: z.nativeEnum(FileFormat).optional(),
    sort: z.nativeEnum(DocumentSort).optional().default(DocumentSort.newest),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(50).optional().default(12),
});

export type DocumentListQueryInput = z.infer<typeof DocumentListQuerySchema>;