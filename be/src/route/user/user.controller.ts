import type { Context } from "hono";
import { getRequestUserId } from "@/lib/auth/request-user";
import { UserListQuerySchema } from "@/validators/user.validator";
import { UserService } from "./user.service";

export class UserController {
  constructor(private readonly service: UserService = new UserService()) {}

  list = async (c: Context) => {
    const userId = getRequestUserId(c);
    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const parsed = UserListQuerySchema.safeParse(c.req.query());

    if (!parsed.success) {
      return c.json(
        {
          error: "Invalid query parameters",
          details: parsed.error.flatten().fieldErrors,
        },
        400
      );
    }

    const result = await this.service.listUsers(parsed.data, userId);
    return c.json(result);
  };
}
