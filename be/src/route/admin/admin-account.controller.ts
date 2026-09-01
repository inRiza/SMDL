import type { Context } from "hono";
import { getRequestUserId } from "@/lib/auth/request-user";
import type { AppEnv } from "@/types/hono";
import {
  AdminAccountIdParamSchema,
  AdminAccountUpdateSchema,
} from "@/validators/admin-account.validator";
import { AdminAccountService } from "./admin-account.service";

function isAdmin(role: string | undefined) {
  return role === "admin";
}

export class AdminAccountController {
  constructor(private readonly service = new AdminAccountService()) {}

  update = async (c: Context<AppEnv>) => {
    const userId = getRequestUserId(c);
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const role = c.get("userRole");
    if (!isAdmin(role)) {
      return c.json({ error: "Forbidden", message: "Hanya administrator yang dapat mengelola akun." }, 403);
    }

    const param = AdminAccountIdParamSchema.safeParse({ id: c.req.param("id") });
    if (!param.success) return c.json({ error: "Invalid id" }, 400);

    const body = await c.req.json().catch(() => null);
    const parsed = AdminAccountUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return c.json(
        { error: "Invalid request", details: parsed.error.flatten().fieldErrors },
        400
      );
    }

    const actor = {
      id: userId,
      email: c.get("userEmail") ?? "",
      name: c.get("userEmail") ?? "",
    };

    const result = await this.service.update(param.data.id, parsed.data, actor);

    if ("error" in result) {
      if (result.error === "NOT_FOUND") {
        return c.json({ error: "Not found", message: "Pengguna tidak ditemukan." }, 404);
      }
      if (result.error === "SELF_MODIFY") {
        return c.json({ error: "Forbidden", message: "Tidak dapat mengubah akun sendiri." }, 403);
      }
      if (result.error === "NO_CHANGES") {
        return c.json({ error: "No changes", message: "Tidak ada perubahan." }, 400);
      }
    }

    return c.json(result);
  };

  softDelete = async (c: Context<AppEnv>) => {
    const userId = getRequestUserId(c);
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const role = c.get("userRole");
    if (!isAdmin(role)) {
      return c.json({ error: "Forbidden", message: "Hanya administrator yang dapat menghapus akun." }, 403);
    }

    const param = AdminAccountIdParamSchema.safeParse({ id: c.req.param("id") });
    if (!param.success) return c.json({ error: "Invalid id" }, 400);

    const actor = {
      id: userId,
      email: c.get("userEmail") ?? "",
      name: c.get("userEmail") ?? "",
    };

    const result = await this.service.softDelete(param.data.id, actor);

    if ("error" in result) {
      if (result.error === "NOT_FOUND") {
        return c.json({ error: "Not found", message: "Pengguna tidak ditemukan." }, 404);
      }
      if (result.error === "SELF_MODIFY") {
        return c.json({ error: "Forbidden", message: "Tidak dapat menghapus akun sendiri." }, 403);
      }
    }

    return c.json({ ok: true });
  };
}
