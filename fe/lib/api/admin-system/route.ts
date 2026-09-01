import { getApiBe } from "@/lib/api/api.be";
import { fetchApi } from "@/lib/api/fetch-api";
import type { SystemHealthResponse } from "@/types/admin-system.types";

export async function fetchSystemHealth(): Promise<SystemHealthResponse | null> {
  const res = await fetchApi(`${getApiBe()}/admin/system/health`);
  if (res.status === 401 || res.status === 403) return null;
  if (!res.ok) return null;
  return res.json() as Promise<SystemHealthResponse>;
}
