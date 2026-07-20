import type { Context } from "hono";
import { DocumentService } from "./document.service";
import { DocumentListQuerySchema } from "@/validators/document.validator";

export class DocumentController {
    constructor(private readonly service: DocumentService = new DocumentService()) {};

    list = async (c: Context) => {
        const parse = DocumentListQuerySchema.safeParse(c.req.query());

        if (!parse.success) {
            return c.json(
                {
                    error: "",
                    details: parse.error.flatten().fieldErrors,
                },
                400
            )
        }

        const res = await this.service.listDocuments(parse.data);

        return c.json(res);
    };

    categories = async (c: Context) => {
        const categories = await this.service.listCategories();
        return c.json(
            {
                data: categories,
            }
        );
    };
}