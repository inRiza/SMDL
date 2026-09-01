import type { Context } from "hono";
import { getRequestUserId } from "@/lib/auth/request-user";
import type { AppEnv } from "@/types/hono";
import { AdminSystemService } from "./admin-system.service";

function isAdmin(role: string | undefined) {
  return role === "admin" || role === "auditor";
}

export class AdminSystemController {
  constructor(private readonly service = new AdminSystemService()) {}

  health = async (c: Context<AppEnv>) => {
    const userId = getRequestUserId(c);
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const role = c.get("userRole");
    if (!isAdmin(role)) {
      return c.json({ error: "Forbidden", message: "Tidak memiliki akses system management." }, 403);
    }

    const result = await this.service.getHealth();
    return c.json(result);
  };
}
