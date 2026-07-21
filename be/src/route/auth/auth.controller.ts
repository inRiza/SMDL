import type { Context } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { env } from "@/lib/config/env.config";
import { loginSchema } from "@/validators/auth.validator";
import type { AppEnv } from "@/types/hono";
import { AuthService } from "./auth.service";

export class AuthController {
  constructor(private readonly service = new AuthService()) {}

  login = async (c: Context<AppEnv>) => {
    const body = await c.req.json().catch(() => null);
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return c.json(
        {
          error: "Invalid request",
          details: parsed.error.flatten().fieldErrors,
        },
        400
      );
    }

    const result = await this.service.login(parsed.data);
    if (!result.ok) {
      return c.json({ error: "Email atau password salah" }, 401);
    }

    setCookie(c, env.SESSION_COOKIE_NAME, result.token, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "Lax",
      path: "/",
      maxAge: env.SESSION_TTL_HOURS * 60 * 60,
    });

    return c.json({ user: result.user });
  };

  logout = async (c: Context<AppEnv>) => {
    const token = getCookie(c, env.SESSION_COOKIE_NAME);
    if (token) {
      await this.service.logout(token);
    }

    deleteCookie(c, env.SESSION_COOKIE_NAME, { path: "/" });
    return c.json({ ok: true });
  };

  me = async (c: Context<AppEnv>) => {
    const token = getCookie(c, env.SESSION_COOKIE_NAME);
    if (!token) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const user = await this.service.getSessionUser(token);
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    return c.json({ user });
  };
}
