import type { Context } from "hono";
import { getRequestUserId } from "@/lib/auth/request-user";
import { DocumentService } from "./document.service";
import {
  CreatePersonalDocumentSchema,
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

    const body = await c.req.json().catch(() => null);
    const parsed = CreatePersonalDocumentSchema.safeParse(body);
    if (!parsed.success) {
      return c.json(
        {
          error: "Invalid request body",
          details: parsed.error.flatten().fieldErrors,
        },
        400
      );
    }

    const workspace = await this.service.getWorkspace(userId);
    if (!workspace?.canUpload) {
      return c.json({ error: "Forbidden" }, 403);
    }

    const document = await this.service.createPersonalDocument(
      userId,
      getActorName(c),
      parsed.data
    );

    return c.json(document, 201);
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
}
