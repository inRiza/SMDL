import { getApiBe } from "@/lib/api/api.be";
import { fetchApi } from "@/lib/api/fetch-api";
import type {
  AdminUserDetail,
  AdminUserListFilters,
  AdminUserListItem,
  AdminUserListResponse,
} from "@/types/admin-user.types";

function adminBase() {
  return `${getApiBe()}/admin`;
}

export async function fetchAdminUsers(
  filters: AdminUserListFilters = {}
): Promise<AdminUserListResponse | null> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  });

  const query = params.toString();
  const res = await fetchApi(`${adminBase()}/users${query ? `?${query}` : ""}`);
  if (res.status === 401 || res.status === 403) return null;
  if (!res.ok) return null;
  return res.json() as Promise<AdminUserListResponse>;
}

export async function fetchAdminUserDetail(id: string): Promise<AdminUserDetail | null> {
  const res = await fetchApi(`${adminBase()}/users/${id}`);
  if (res.status === 401 || res.status === 403) return null;
  if (!res.ok) return null;
  const json = (await res.json()) as { data: AdminUserDetail };
  return json.data;
}

export async function updateAdminAccount(
  id: string,
  body: { role?: AdminUserListItem["role"]; status?: "active" | "deactivated" }
): Promise<{ ok: boolean; error?: string }> {
  const res = await fetchApi(`${adminBase()}/accounts/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (res.status === 403) {
    const json = (await res.json().catch(() => ({}))) as { message?: string };
    return { ok: false, error: json.message ?? "Akses ditolak." };
  }
  if (!res.ok) return { ok: false, error: "Gagal memperbarui akun." };
  return { ok: true };
}

export async function deleteAdminAccount(id: string): Promise<{ ok: boolean; error?: string }> {
  const res = await fetchApi(`${adminBase()}/accounts/${id}`, { method: "DELETE" });

  if (res.status === 403) {
    const json = (await res.json().catch(() => ({}))) as { message?: string };
    return { ok: false, error: json.message ?? "Akses ditolak." };
  }
  if (!res.ok) return { ok: false, error: "Gagal menghapus akun." };
  return { ok: true };
}
