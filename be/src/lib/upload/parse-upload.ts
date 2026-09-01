import { z } from "zod";
import { env } from "@/lib/config/env.config";
import {
  parseDocumentMetadata,
  parsePublishedAt,
} from "@/lib/document/document-metadata";

const ALLOWED_MIME: Record<"pdf" | "docx", string[]> = {
  pdf: ["application/pdf"],
  docx: [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/octet-stream",
  ],
};

export function detectFileFormat(fileName: string, mimeType: string): "pdf" | "docx" | null {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".pdf") || mimeType === "application/pdf") return "pdf";
  if (lower.endsWith(".docx") || ALLOWED_MIME.docx.includes(mimeType)) return "docx";
  return null;
}

export async function parseUploadFormData(formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new Error("File wajib diunggah");
  }

  if (file.size > env.MAX_UPLOAD_BYTES) {
    throw new Error(`Ukuran file melebihi ${Math.floor(env.MAX_UPLOAD_BYTES / (1024 * 1024))}MB`);
  }

  const fileFormat = detectFileFormat(file.name, file.type);
  if (!fileFormat) {
    throw new Error("Format file harus PDF atau DOCX");
  }

  const metadataSchema = z.object({
    title: z.string().trim().min(2),
    description: z.string().trim().optional(),
    category: z.string().trim().optional(),
    visibility: z.enum(["public", "organization"]).optional(),
  });

  const parsed = metadataSchema.safeParse({
    title: String(formData.get("title") ?? ""),
    description: formData.get("description")
      ? String(formData.get("description"))
      : undefined,
    category: formData.get("category") ? String(formData.get("category")) : undefined,
    visibility: formData.get("visibility")
      ? String(formData.get("visibility"))
      : undefined,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Metadata tidak valid");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const metadata = parseDocumentMetadata(formData);

  return {
    ...parsed.data,
    ...metadata,
    publishedAt: parsePublishedAt(metadata.publishedAt),
    fileFormat,
    fileName: file.name,
    fileBuffer: buffer,
    fileSizeBytes: buffer.length,
  };
}
