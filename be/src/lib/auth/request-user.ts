import type { Context } from "hono";

export function getRequestUserId(c: Context): string | null {
  const userId = c.get("userId");
  return typeof userId === "string" && userId.length > 0 ? userId : null;
}

export function unauthorizedResponse() {
  return {
    error: "Unauthorized",
    message: "Autentikasi diperlukan untuk mengakses TELLS.",
  } as const;
}
