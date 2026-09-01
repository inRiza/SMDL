import type { Context } from "hono";

export function getRequestIp(c: Context) {
  const forwarded = c.req.header("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? null;
  }
  return c.req.header("x-real-ip") ?? null;
}

export function getRequestId(c: Context) {
  return c.req.header("x-request-id") ?? null;
}
