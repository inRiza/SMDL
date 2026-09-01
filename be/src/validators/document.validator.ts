import { z } from "zod";
import { DocumentStatus, FileFormat, DocumentSort } from "@prisma/client";
import {
  CONTENT_AREAS,
  DOCUMENT_CLASSIFICATIONS,
  DOCUMENT_TYPES,
} from "@/lib/document/document-metadata";

const fileFormats = ["pdf", "docx"] as const;

const classificationValues = DOCUMENT_CLASSIFICATIONS.map((item) => item.value) as [
  (typeof DOCUMENT_CLASSIFICATIONS)[number]["value"],
  ...(typeof DOCUMENT_CLASSIFICATIONS)[number]["value"][],
];
const documentTypeValues = DOCUMENT_TYPES.map((item) => item.value) as [
  (typeof DOCUMENT_TYPES)[number]["value"],
  ...(typeof DOCUMENT_TYPES)[number]["value"][],
];
const contentAreaValues = CONTENT_AREAS.map((item) => item.value) as [
  (typeof CONTENT_AREAS)[number]["value"],
  ...(typeof CONTENT_AREAS)[number]["value"][],
];

export const DocumentListQuerySchema = z.object({
    q: z.string().trim().optional(),
    category: z.string().trim().optional(),
    classification: z.enum(classificationValues).optional(),
    documentType: z.enum(documentTypeValues).optional(),
    contentArea: z.enum(contentAreaValues).optional(),
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

export type CreatePersonalDocumentWithFile = {
  title: string;
  description?: string;
  category?: string;
  documentType?: string;
  contentArea?: string;
  classification?: string;
  publishedAt?: Date;
  revision?: string;
  legalStatus?: string;
  source?: string;
  fileFormat: "pdf" | "docx";
  fileBuffer: Buffer;
  fileName: string;
  fileSizeBytes: number;
};

export const UpdatePersonalDocumentSchema = z.object({
  title: z.string().trim().min(2).optional(),
  description: z.string().trim().optional(),
  category: z.string().trim().nullable().optional(),
});

export type DocumentListQueryInput = z.infer<typeof DocumentListQuerySchema>;
export type CreatePersonalDocumentInput = z.infer<typeof CreatePersonalDocumentSchema>;
export type UpdatePersonalDocumentInput = z.infer<typeof UpdatePersonalDocumentSchema>;