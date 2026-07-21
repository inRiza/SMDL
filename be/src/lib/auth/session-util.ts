import { createHash, randomBytes } from "crypto";
import { env } from "@/lib/config/env.config";

export function generateSessionToken() {
  return randomBytes(32).toString("hex");
}

export function hashSessionToken(token: string) {
  return createHash("sha256")
    .update(`${token}:${env.SESSION_SECRET}`)
    .digest("hex");
}

export function getSessionExpiry() {
  return new Date(Date.now() + env.SESSION_TTL_HOURS * 60 * 60 * 1000);
}
