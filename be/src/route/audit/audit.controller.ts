import type { Context } from "hono";
import { getRequestUserId } from "@/lib/auth/request-user";
import type { AppEnv } from "@/types/hono";
import { AuditIdParamSchema, AuditListQuerySchema } from "@/validators/audit.validator";
import { AuditService } from "./audit.service";

function canViewAudit(role: string | undefined) {
  return role === "admin" || role === "auditor";
}

export class AuditController {
  constructor(private readonly service = new AuditService()) {}

  list = async (c: Context<AppEnv>) => {
    const userId = getRequestUserId(c);
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const role = c.get("userRole");
    if (!canViewAudit(role)) {
      return c.json({ error: "Forbidden", message: "Tidak memiliki akses audit log." }, 403);
    }

    const parsed = AuditListQuerySchema.safeParse(c.req.query());
    if (!parsed.success) {
      return c.json(
        { error: "Invalid query parameters", details: parsed.error.flatten().fieldErrors },
        400
      );
    }

    const result = await this.service.list(parsed.data);
    if ("error" in result && result.error === "INVALID_CURSOR") {
      return c.json(
        { error: { code: "INVALID_CURSOR", message: "Cursor tidak valid." } },
        400
      );
    }

    return c.json(result);
  };

  getById = async (c: Context<AppEnv>) => {
    const userId = getRequestUserId(c);
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const role = c.get("userRole");
    if (!canViewAudit(role)) {
      return c.json({ error: "Forbidden", message: "Tidak memiliki akses audit log." }, 403);
    }

    const parsed = AuditIdParamSchema.safeParse({ id: c.req.param("id") });
    if (!parsed.success) {
      return c.json({ error: "Invalid id" }, 400);
    }

    const row = await this.service.getById(parsed.data.id);
    if (!row) {
      return c.json({ error: "Not found", message: "Audit log tidak ditemukan." }, 404);
    }

    return c.json({ data: row });
  };

  overview = async (c: Context<AppEnv>) => {
    const userId = getRequestUserId(c);
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const role = c.get("userRole");
    if (!canViewAudit(role)) {
      return c.json({ error: "Forbidden", message: "Tidak memiliki akses audit log." }, 403);
    }

    const stats = await this.service.getOverview();
    const recent = await this.service.list({ limit: 10 });

    if ("error" in recent && recent.error === "INVALID_CURSOR") {
      return c.json({ stats, recent: { data: [], hasMore: false, nextCursor: null } });
    }

    return c.json({ stats, recent });
  };
}
