import type { Context } from "hono";
import { getRequestUserId } from "@/lib/auth/request-user";
import type { AppEnv } from "@/types/hono";
import {
  AdminUserIdParamSchema,
  AdminUserListQuerySchema,
} from "@/validators/admin-user.validator";
import { AdminUserService } from "./admin-user.service";

function canViewAdminUsers(role: string | undefined) {
  return role === "admin" || role === "auditor";
}

export class AdminUserController {
  constructor(private readonly service = new AdminUserService()) {}

  list = async (c: Context<AppEnv>) => {
    const userId = getRequestUserId(c);
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const role = c.get("userRole");
    if (!canViewAdminUsers(role)) {
      return c.json({ error: "Forbidden", message: "Tidak memiliki akses daftar pengguna." }, 403);
    }

    const parsed = AdminUserListQuerySchema.safeParse(c.req.query());
    if (!parsed.success) {
      return c.json(
        { error: "Invalid query parameters", details: parsed.error.flatten().fieldErrors },
        400
      );
    }

    const result = await this.service.list(parsed.data);
    return c.json(result);
  };

  getById = async (c: Context<AppEnv>) => {
    const userId = getRequestUserId(c);
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const role = c.get("userRole");
    if (!canViewAdminUsers(role)) {
      return c.json({ error: "Forbidden", message: "Tidak memiliki akses daftar pengguna." }, 403);
    }

    const parsed = AdminUserIdParamSchema.safeParse({ id: c.req.param("id") });
    if (!parsed.success) {
      return c.json({ error: "Invalid id" }, 400);
    }

    const user = await this.service.getById(parsed.data.id);
    if (!user) {
      return c.json({ error: "Not found", message: "Pengguna tidak ditemukan." }, 404);
    }

    return c.json({ data: user });
  };
}
