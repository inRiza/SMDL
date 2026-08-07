import type { UserListFilters, UserListResponse } from "@/types/user.types";
import { getApiBeUsers } from "../api.be";

function buildQuery(filters: UserListFilters): string {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  });

  return params.toString();
}

export async function fetchUsers(
  filters: UserListFilters = {}
): Promise<UserListResponse> {
  const query = buildQuery(filters);
  const res = await fetch(`${getApiBeUsers()}?${query}`, {
    cache: "no-store",
    credentials: "include",
  });

  if (res.status === 401) {
    throw new Error("Sesi berakhir. Silakan login ulang.");
  }

  if (!res.ok) {
    throw new Error("Gagal memuat daftar pengguna");
  }

  return res.json();
}
