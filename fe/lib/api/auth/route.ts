import type { AuthUser } from "@/types/auth.types";
import { getApiBeAuth } from "../api.be";

export async function loginRequest(email: string, password: string) {
  const res = await fetch(`${getApiBeAuth()}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? "Login gagal");
  }

  return res.json() as Promise<{ user: AuthUser }>;
}

export async function logoutRequest() {
  await fetch(`${getApiBeAuth()}/logout`, {
    method: "POST",
    credentials: "include",
  });
}

export async function fetchMe(): Promise<AuthUser | null> {
  const res = await fetch(`${getApiBeAuth()}/me`, {
    credentials: "include",
    cache: "no-store",
  });

  if (res.status === 401) return null;
  if (!res.ok) throw new Error("Gagal memuat sesi");

  const data = (await res.json()) as { user: AuthUser };
  return data.user;
}

// export function getDisplayName(email: string) {
//   return email.split("@")[0] ?? email.replace(/\./g, " ");
// }
