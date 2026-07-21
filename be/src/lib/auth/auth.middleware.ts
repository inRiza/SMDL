import type { Context, Next } from "hono";
import { getCookie } from "hono/cookie";
import { env } from "@/lib/config/env.config";
import { AuthService } from "@/route/auth/auth.service";
import type { AppEnv } from "@/types/hono";

const authService = new AuthService();

export async function authMiddleware(c: Context<AppEnv>, next: Next) {
  const token = getCookie(c, env.SESSION_COOKIE_NAME);

  if (token) {
    const user = await authService.getSessionUser(token);
    if (user) {
      c.set("userId", user.id);
      c.set("userRole", user.role);
      c.set("userEmail", user.email);
    }
  }

  await next();
}
