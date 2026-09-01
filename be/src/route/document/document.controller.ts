import type { Context } from "hono";
import { getRequestUserId } from "@/lib/auth/request-user";
import { parseUploadFormData } from "@/lib/upload/parse-upload";
import { DocumentService } from "./document.service";
import {
  DocumentListQuerySchema,
  UpdatePersonalDocumentSchema,
} from "@/validators/document.validator";

function getActorName(c: Context) {
  const email = c.get("userEmail");
  return typeof email === "string" && email ? email : "Pengguna";
}

export class DocumentController {
  constructor(private readonly service: DocumentService = new DocumentService()) {}

  list = async (c: Context) => {
    const parse = DocumentListQuerySchema.safeParse(c.req.query());

    if (!parse.success) {
      return c.json(
        {
          error: "Invalid query parameters",
          details: parse.error.flatten().fieldErrors,
        },
        400
      );
    }

    const userId = getRequestUserId(c) ?? undefined;
    const res = await this.service.listDocuments(parse.data, userId);

    return c.json(res);
  };

  categories = async (c: Context) => {
    const userId = getRequestUserId(c) ?? undefined;
    const categories = await this.service.listCategories(userId);
    return c.json({ data: categories });
  };

  workspace = async (c: Context) => {
    const userId = getRequestUserId(c);
    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const workspace = await this.service.getWorkspace(userId);
    if (!workspace) {
      return c.json({ error: "User not found" }, 404);
    }

    return c.json(workspace);
  };

  create = async (c: Context) => {
    const userId = getRequestUserId(c);
    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const workspace = await this.service.getWorkspace(userId);
    if (!workspace?.canUpload) {
      return c.json({ error: "Forbidden" }, 403);
    }

    try {
      const formData = await c.req.formData();
      const upload = await parseUploadFormData(formData);

      const document = await this.service.createPersonalDocument(userId, getActorName(c), {
        title: upload.title,
        description: upload.description,
        category: upload.category,
        documentType: upload.documentType,
        contentArea: upload.contentArea,
        classification: upload.classification,
        publishedAt: upload.publishedAt,
        revision: upload.revision,
        legalStatus: upload.legalStatus,
        source: upload.source,
        fileFormat: upload.fileFormat,
        fileBuffer: upload.fileBuffer,
        fileName: upload.fileName,
        fileSizeBytes: upload.fileSizeBytes,
      });

      return c.json(document, 201);
    } catch (error) {
      return c.json(
        { error: error instanceof Error ? error.message : "Gagal mengunggah dokumen" },
        400
      );
    }
  };

  update = async (c: Context) => {
    const userId = getRequestUserId(c);
    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const id = c.req.param("id");
    if (!id) {
      return c.json({ error: "Document id is required" }, 400);
    }

    const body = await c.req.json().catch(() => null);
    const parsed = UpdatePersonalDocumentSchema.safeParse(body);
    if (!parsed.success) {
      return c.json(
        {
          error: "Invalid request body",
          details: parsed.error.flatten().fieldErrors,
        },
        400
      );
    }

    const result = await this.service.updatePersonalDocument(
      id,
      userId,
      getActorName(c),
      parsed.data
    );

    if (result === "not_found") {
      return c.json({ error: "Document not found" }, 404);
    }

    return c.json(result);
  };

  revoke = async (c: Context) => {
    const userId = getRequestUserId(c);
    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const id = c.req.param("id");
    if (!id) {
      return c.json({ error: "Document id is required" }, 400);
    }

    const result = await this.service.revokePersonalDocument(id, userId, getActorName(c));
    if (result === "not_found") {
      return c.json({ error: "Document not found" }, 404);
    }

    return c.json({ ok: true });
  };

  getById = async (c: Context) => {
    const id = c.req.param("id");
    if (!id) {
      return c.json({ error: "Document id is required" }, 400);
    }

    const userId = getRequestUserId(c) ?? undefined;
    const document = await this.service.getDocumentById(id, userId);

    if (document === "forbidden") {
      return c.json({ error: "Forbidden" }, 403);
    }

    if (!document) {
      return c.json({ error: "Document not found" }, 404);
    }

    return c.json(document);
  };

  getFile = async (c: Context) => {
    const id = c.req.param("id");
    if (!id) {
      return c.json({ error: "Document id is required" }, 400);
    }

    const userId = getRequestUserId(c) ?? undefined;
    const inline = c.req.query("inline") !== "0";
    const result = await this.service.getDocumentFile(id, userId, inline);

    if (result === "forbidden") {
      return c.json({ error: "Forbidden" }, 403);
    }

    if (result === "not_found") {
      return c.json({ error: "Document not found" }, 404);
    }

    const disposition = result.inline ? "inline" : "attachment";
    const encodedName = encodeURIComponent(result.fileName);

    return new Response(result.buffer, {
      headers: {
        "Content-Type": result.mimeType,
        "Content-Disposition": `${disposition}; filename="${encodedName}"; filename*=UTF-8''${encodedName}`,
        "Content-Length": String(result.buffer.length),
        "Cache-Control": "private, max-age=3600",
      },
    });
  };
}
