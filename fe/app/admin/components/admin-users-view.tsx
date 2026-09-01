"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, ChevronRight } from "lucide-react";
import { FilterDropdown } from "@/app/(app)/wiki/components/filter-dropdown";
import { MemberAvatar } from "@/app/(app)/organizations/components/member-avatars";
import { AdminHeroBanner } from "@/app/admin/components/admin-hero-banner";
import { AdminSearchSection } from "@/app/admin/components/admin-search-section";
import { Button } from "@/components/ui/button";
import { fetchAdminUsers } from "@/lib/api/admin-user/route";
import { formatActivityDate, formatRelativeTime } from "@/lib/organization-activity";
import type { AdminUserListItem } from "@/types/admin-user.types";
import { RISK_LABELS, USER_ROLE_LABELS } from "@/types/admin-user.types";
import { cn } from "@/lib/utils";

const ROLE_OPTIONS = [
  { value: "", label: "Semua peran" },
  { value: "admin", label: "Administrator" },
  { value: "owner", label: "Owner" },
  { value: "viewer", label: "Viewer" },
  { value: "auditor", label: "Auditor" },
];

const SORT_OPTIONS = [
  { value: "name_asc", label: "Nama A–Z" },
  { value: "name_desc", label: "Nama Z–A" },
  { value: "logs_desc", label: "Log terbanyak" },
  { value: "failed_desc", label: "Gagal terbanyak" },
  { value: "activity_desc", label: "Aktivitas terbaru" },
];

function RiskBadge({ level }: { level: AdminUserListItem["audit"]["riskLevel"] }) {
  const styles = {
    low: "bg-emerald-50 text-emerald-700",
    medium: "bg-amber-50 text-amber-700",
    high: "bg-red-50 text-red-700",
  };

  return (
    <span className={cn("rounded-sm px-2 py-0.5 text-[11px] font-medium", styles[level])}>
      {RISK_LABELS[level]}
    </span>
  );
}

export function AdminUsersView() {
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("");
  const [sort, setSort] = useState("name_asc");
  const [showFilters, setShowFilters] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchAdminUsers({
        q: query.trim() || undefined,
        role: role ? (role as AdminUserListItem["role"]) : undefined,
        sort: sort as "name_asc" | "name_desc" | "logs_desc" | "failed_desc" | "activity_desc",
        limit: 50,
      });

      if (!result) {
        setError("Gagal memuat daftar pengguna.");
        setUsers([]);
        setTotal(0);
        return;
      }

      setUsers(result.data);
      setTotal(result.meta.total);
    } catch {
      setError("Terjadi kesalahan saat memuat pengguna.");
    } finally {
      setLoading(false);
    }
  }, [query, role, sort]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 300);
    return () => clearTimeout(timer);
  }, [load]);

  const summary = useMemo(() => {
    const highRisk = users.filter((u) => u.audit.riskLevel === "high").length;
    const withFailures = users.filter((u) => u.audit.failedLogs > 0).length;
    const totalLogs = users.reduce((sum, u) => sum + u.audit.totalLogs, 0);
    return { highRisk, withFailures, totalLogs };
  }, [users]);

  const hasActiveFilters = Boolean(role || sort !== "name_asc");

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-telkom-grey-50">
      <AdminHeroBanner
        eyebrow="Manajemen Pengguna"
        title="Daftar User"
        description="Monitoring pengguna beserta profil risiko berdasarkan audit log"
        loading={loading}
        stats={[
          { label: "Total pengguna", value: total },
          { label: "Risiko tinggi", value: summary.highRisk },
          { label: "Ada log gagal", value: summary.withFailures },
          { label: "Total log (halaman)", value: summary.totalLogs },
        ]}
      />

      <AdminSearchSection
        query={query}
        onQueryChange={setQuery}
        placeholder="Cari nama atau email pengguna..."
        loading={loading}
        onRefresh={() => void load()}
        onToggleFilters={() => setShowFilters((prev) => !prev)}
        filtersOpen={showFilters}
        hasActiveFilters={hasActiveFilters}
        filters={
          <>
            <FilterDropdown
              label="Peran"
              value={role}
              onChange={setRole}
              options={ROLE_OPTIONS}
            />
            <FilterDropdown label="Urutkan" value={sort} onChange={setSort} options={SORT_OPTIONS} />
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={() => {
                  setRole("");
                  setSort("name_asc");
                }}
                className="cursor-pointer rounded-sm px-2 py-1.5 text-xs font-medium text-telkom-red hover:bg-telkom-red/5"
              >
                Reset filter
              </button>
            ) : null}
          </>
        }
      />

      <div className="flex items-center justify-between px-4 py-3 md:px-6">
        <p className="text-sm text-telkom-grey-600">
          <span className="font-medium text-telkom-grey-900">{users.length}</span> pengguna
          ditampilkan
        </p>
      </div>

      <div className="w-full px-4 pb-6 md:px-6">
        <div className="overflow-hidden rounded-xl bg-white shadow-sm shadow-black/5">
          {loading ? (
            <div className="px-5 py-12 text-center text-sm text-telkom-grey-500">
              Memuat daftar pengguna...
            </div>
          ) : error ? (
            <div className="px-5 py-12 text-center">
              <AlertCircle className="mx-auto size-8 text-telkom-grey-400" />
              <p className="mt-3 text-sm text-telkom-grey-600">{error}</p>
              <Button
                type="button"
                size="sm"
                className="mt-4 cursor-pointer bg-telkom-red hover:bg-telkom-red-dark"
                onClick={() => void load()}
              >
                Coba lagi
              </Button>
            </div>
          ) : users.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-telkom-grey-500">
              Tidak ada pengguna yang cocok dengan pencarian.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px] text-left text-sm">
                <thead>
                  <tr className="border-b border-telkom-grey-100 bg-telkom-grey-50/80">
                    <th className="px-4 py-3 font-medium text-telkom-grey-600 md:px-5">Pengguna</th>
                    <th className="px-4 py-3 font-medium text-telkom-grey-600 md:px-5">Peran</th>
                    <th className="px-4 py-3 font-medium text-telkom-grey-600 md:px-5">Total log</th>
                    <th className="px-4 py-3 font-medium text-telkom-grey-600 md:px-5">Log gagal</th>
                    <th className="px-4 py-3 font-medium text-telkom-grey-600 md:px-5">
                      Login gagal
                    </th>
                    <th className="px-4 py-3 font-medium text-telkom-grey-600 md:px-5">
                      Tingkat risiko
                    </th>
                    <th className="px-4 py-3 font-medium text-telkom-grey-600 md:px-5">
                      Aktivitas terakhir
                    </th>
                    <th className="px-4 py-3 md:px-5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-telkom-grey-100">
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="group transition-colors hover:bg-telkom-grey-50"
                    >
                      <td className="px-4 py-3.5 md:px-5">
                        <Link
                          href={`/admin/users/${user.id}`}
                          className="flex items-center gap-3"
                        >
                          <MemberAvatar name={user.name || user.email} size="default" />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-telkom-grey-900">
                              {user.name || "—"}
                            </p>
                            <p className="truncate text-xs text-telkom-grey-500">{user.email}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 text-telkom-grey-700 md:px-5">
                        {USER_ROLE_LABELS[user.role]}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-telkom-grey-900 md:px-5">
                        {user.audit.totalLogs}
                      </td>
                      <td className="px-4 py-3.5 md:px-5">
                        <span
                          className={cn(
                            "font-medium",
                            user.audit.failedLogs > 0 ? "text-amber-600" : "text-telkom-grey-700"
                          )}
                        >
                          {user.audit.failedLogs}
                        </span>
                        {user.audit.failedLogs24h > 0 ? (
                          <span className="ml-1 text-xs text-telkom-grey-400">
                            ({user.audit.failedLogs24h}/24j)
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3.5 md:px-5">
                        <span
                          className={cn(
                            "font-medium",
                            user.audit.loginFailedCount > 0
                              ? "text-red-600"
                              : "text-telkom-grey-700"
                          )}
                        >
                          {user.audit.loginFailedCount}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 md:px-5">
                        <RiskBadge level={user.audit.riskLevel} />
                      </td>
                      <td className="px-4 py-3.5 text-xs text-telkom-grey-500 md:px-5">
                        {user.audit.lastActivityAt ? (
                          <span title={formatActivityDate(user.audit.lastActivityAt)}>
                            {formatRelativeTime(user.audit.lastActivityAt)}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3.5 md:px-5">
                        <Link
                          href={`/admin/users/${user.id}`}
                          className="inline-flex size-8 items-center justify-center rounded-sm text-telkom-grey-400 transition-colors group-hover:bg-telkom-grey-100 group-hover:text-telkom-grey-700"
                        >
                          <ChevronRight className="size-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
