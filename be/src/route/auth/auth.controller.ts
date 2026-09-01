import type { Context } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { AUDIT_EVENT_TYPES } from "@/lib/audit/audit-event-types";
import { recordAudit } from "@/lib/audit/record-audit";
import { env } from "@/lib/config/env.config";
import { getRequestId, getRequestIp } from "@/lib/http/request-meta";
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
      void recordAudit({
        eventType: AUDIT_EVENT_TYPES.AUTH_LOGIN_FAILED,
        summary: `Login gagal untuk ${parsed.data.email}`,
        status: "failure",
        userEmail: parsed.data.email.toLowerCase(),
        aggregateType: "user",
        ipAddress: getRequestIp(c),
        requestId: getRequestId(c),
        metadata: { reason: result.reason },
      }).catch((err) => console.error("[audit] login failed record error", err));

      if (result.reason === "account_dormant") {
        return c.json({ error: "Akun dinonaktifkan (dormant). Hubungi administrator." }, 403);
      }
      if (result.reason === "account_deleted") {
        return c.json({ error: "Akun tidak ditemukan." }, 401);
      }

      return c.json({ error: "Email atau password salah" }, 401);
    }

    void recordAudit({
      eventType: AUDIT_EVENT_TYPES.AUTH_LOGIN,
      summary: `${result.user.name || result.user.email} berhasil login`,
      status: "success",
      userId: result.user.id,
      userEmail: result.user.email,
      userName: result.user.name,
      aggregateId: result.user.id,
      aggregateType: "user",
      ipAddress: getRequestIp(c),
      requestId: getRequestId(c),
    }).catch((err) => console.error("[audit] login record error", err));

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
    const userId = c.get("userId");
    const userEmail = c.get("userEmail");

    if (token) {
      await this.service.logout(token);
    }

    if (userId) {
      void recordAudit({
        eventType: AUDIT_EVENT_TYPES.AUTH_LOGOUT,
        summary: `${userEmail ?? "Pengguna"} logout`,
        status: "success",
        userId,
        userEmail: userEmail ?? null,
        aggregateId: userId,
        aggregateType: "user",
        ipAddress: getRequestIp(c),
        requestId: getRequestId(c),
      }).catch((err) => console.error("[audit] logout record error", err));
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
