import { z } from "zod";
import { DocumentStatus, FileFormat, DocumentSort } from "@prisma/client";

const fileFormats = ["pdf", "docx"] as const;

export const DocumentListQuerySchema = z.object({
    q: z.string().trim().optional(),
    category: z.string().trim().optional(),
    status: z.nativeEnum(DocumentStatus).optional(),
    fileFormat: z.nativeEnum(FileFormat).optional(),
    sort: z.nativeEnum(DocumentSort).optional().default(DocumentSort.newest),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(50).optional().default(12),
});

export const CreatePersonalDocumentSchema = z.object({
  title: z.string().trim().min(2, "Nama dokumen minimal 2 karakter"),
  description: z.string().trim().optional(),
  category: z.string().trim().optional(),
  fileFormat: z.enum(fileFormats).default("pdf"),
  fileSizeBytes: z.coerce.number().int().min(1).optional().default(1024),
});

export const UpdatePersonalDocumentSchema = z.object({
  title: z.string().trim().min(2).optional(),
  description: z.string().trim().optional(),
  category: z.string().trim().nullable().optional(),
});

export type DocumentListQueryInput = z.infer<typeof DocumentListQuerySchema>;
export type CreatePersonalDocumentInput = z.infer<typeof CreatePersonalDocumentSchema>;
export type UpdatePersonalDocumentInput = z.infer<typeof UpdatePersonalDocumentSchema>;