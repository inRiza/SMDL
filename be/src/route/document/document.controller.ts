import type { Context } from "hono";
import { getRequestUserId } from "@/lib/auth/request-user";
import { DocumentService } from "./document.service";
import { DocumentListQuerySchema } from "@/validators/document.validator";

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
};
