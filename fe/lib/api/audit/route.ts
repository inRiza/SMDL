import { getApiBe } from "@/lib/api/api.be";
import { fetchApi } from "@/lib/api/fetch-api";
import type { AuditListResponse, AuditOverviewResponse } from "@/types/audit.types";

function auditBase() {
  return `${getApiBe()}/audit`;
}

export async function fetchAuditOverview(): Promise<AuditOverviewResponse | null> {
  const res = await fetchApi(`${auditBase()}/overview`);
  if (res.status === 401 || res.status === 403) return null;
  if (!res.ok) {
    console.error("[audit] overview failed", res.status, await res.text().catch(() => ""));
    return null;
  }
  return res.json() as Promise<AuditOverviewResponse>;
}

export async function fetchAuditLogs(params?: {
  limit?: number;
  cursor?: string;
  q?: string;
  eventType?: string;
  status?: "success" | "failure";
  userId?: string;
}): Promise<AuditListResponse | null> {
  const search = new URLSearchParams();
  if (params?.limit) search.set("limit", String(params.limit));
  if (params?.cursor) search.set("cursor", params.cursor);
  if (params?.q) search.set("q", params.q);
  if (params?.eventType) search.set("eventType", params.eventType);
  if (params?.status) search.set("status", params.status);
  if (params?.userId) search.set("userId", params.userId);

  const query = search.toString();
  const res = await fetchApi(`${auditBase()}${query ? `?${query}` : ""}`);
  if (!res.ok) return null;
  return res.json() as Promise<AuditListResponse>;
}
