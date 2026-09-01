"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, MoreHorizontal } from "lucide-react";
import { FilterDropdown } from "@/app/(app)/wiki/components/filter-dropdown";
import { AdminHeroBanner } from "@/app/admin/components/admin-hero-banner";
import { AdminSearchSection } from "@/app/admin/components/admin-search-section";
import { MemberAvatar } from "@/app/(app)/organizations/components/member-avatars";
import { Button } from "@/components/ui/button";
import { AppDropdown } from "@/components/ui/app-dropdown";
import { useConfirm } from "@/components/providers/confirm-dialog-provider";
import {
  deleteAdminAccount,
  fetchAdminUsers,
  updateAdminAccount,
} from "@/lib/api/admin-user/route";
import { formatActivityDate } from "@/lib/organization-activity";
import type { AdminUserListItem } from "@/types/admin-user.types";
import {
  USER_ROLE_LABELS,
  USER_STATUS_LABELS,
} from "@/types/admin-user.types";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";

const ROLE_OPTIONS = [
  { value: "", label: "Semua peran" },
  { value: "admin", label: "Administrator" },
  { value: "owner", label: "Owner" },
  { value: "viewer", label: "Viewer" },
  { value: "auditor", label: "Auditor" },
];

const STATUS_FILTER_OPTIONS = [
  { value: "", label: "Semua status" },
  { value: "active", label: "Aktif" },
  { value: "deactivated", label: "Dormant" },
  { value: "deleted", label: "Dihapus" },
];

const ROLE_CHANGE_OPTIONS = [
  { value: "admin", label: "Administrator" },
  { value: "owner", label: "Owner" },
  { value: "viewer", label: "Viewer" },
  { value: "auditor", label: "Auditor" },
];

function StatusBadge({ status }: { status: AdminUserListItem["status"] }) {
  const styles = {
    active: "bg-emerald-50 text-emerald-700",
    deactivated: "bg-amber-50 text-amber-700",
    deleted: "bg-telkom-grey-100 text-telkom-grey-600",
  };

  return (
    <span className={cn("rounded-sm px-2 py-0.5 text-[11px] font-medium", styles[status])}>
      {USER_STATUS_LABELS[status]}
    </span>
  );
}

export function AdminAccountsView() {
  const confirm = useConfirm();
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchAdminUsers({
        q: query.trim() || undefined,
        role: role ? (role as AdminUserListItem["role"]) : undefined,
        status: status ? (status as AdminUserListItem["status"]) : undefined,
        limit: 50,
      });

      if (!result) {
        setError("Gagal memuat daftar akun.");
        setUsers([]);
        setTotal(0);
        return;
      }

      setUsers(result.data);
      setTotal(result.meta.total);
    } catch {
      setError("Terjadi kesalahan saat memuat akun.");
    } finally {
      setLoading(false);
    }
  }, [query, role, status]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 300);
    return () => clearTimeout(timer);
  }, [load]);

  const summary = useMemo(() => {
    const active = users.filter((u) => u.status === "active").length;
    const dormant = users.filter((u) => u.status === "deactivated").length;
    const admins = users.filter((u) => u.role === "admin").length;
    return { active, dormant, admins };
  }, [users]);

  const hasActiveFilters = Boolean(role || status);

  async function handleRoleChange(user: AdminUserListItem, newRole: string) {
    if (newRole === user.role) return;
    setActionId(user.id);
    const result = await updateAdminAccount(user.id, {
      role: newRole as AdminUserListItem["role"],
    });
    setActionId(null);
    if (!result.ok) {
      toast.error(result.error ?? "Gagal mengubah peran.");
      return;
    }
    toast.success(`Peran ${user.email} diubah menjadi ${newRole}.`);
    void load();
  }

  async function handleStatusToggle(user: AdminUserListItem) {
    const next = user.status === "active" ? "deactivated" : "active";
    const label = next === "deactivated" ? "menonaktifkan" : "mengaktifkan";
    const ok = await confirm({
      title: `${label.charAt(0).toUpperCase()}${label.slice(1)} akun?`,
      description: `Akun ${user.email} akan ${next === "deactivated" ? "dinonaktifkan (dormant)" : "diaktifkan kembali"}.`,
      confirmLabel: label.charAt(0).toUpperCase() + label.slice(1),
      variant: next === "deactivated" ? "destructive" : "default",
    });
    if (!ok) return;

    setActionId(user.id);
    const result = await updateAdminAccount(user.id, { status: next });
    setActionId(null);
    if (!result.ok) {
      toast.error(result.error ?? "Gagal mengubah status.");
      return;
    }
    toast.success(
      next === "deactivated"
        ? `Akun ${user.email} dinonaktifkan.`
        : `Akun ${user.email} diaktifkan kembali.`
    );
    void load();
  }

  async function handleDelete(user: AdminUserListItem) {
    const ok = await confirm({
      title: "Hapus akun?",
      description: `Akun ${user.email} akan di-soft delete dan tercatat di audit log.`,
      confirmLabel: "Hapus akun",
      variant: "destructive",
    });
    if (!ok) return;

    setActionId(user.id);
    const result = await deleteAdminAccount(user.id);
    setActionId(null);
    if (!result.ok) {
      toast.error(result.error ?? "Gagal menghapus akun.");
      return;
    }
    toast.success(`Akun ${user.email} dihapus.`);
    void load();
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-telkom-grey-50">
      <AdminHeroBanner
        eyebrow="Account Management"
        title="Kelola Akun Pengguna"
        description="Ubah peran, nonaktifkan (dormant), atau hapus akun pengguna SMDL"
        loading={loading}
        stats={[
          { label: "Total akun", value: total },
          { label: "Aktif", value: summary.active },
          { label: "Dormant", value: summary.dormant },
          { label: "Administrator", value: summary.admins },
        ]}
      />

      <AdminSearchSection
        query={query}
        onQueryChange={setQuery}
        placeholder="Cari nama atau email..."
        loading={loading}
        onRefresh={() => void load()}
        onToggleFilters={() => setShowFilters((prev) => !prev)}
        filtersOpen={showFilters}
        hasActiveFilters={hasActiveFilters}
        filters={
          <>
            <FilterDropdown label="Peran" value={role} onChange={setRole} options={ROLE_OPTIONS} />
            <FilterDropdown
              label="Status"
              value={status}
              onChange={setStatus}
              options={STATUS_FILTER_OPTIONS}
            />
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={() => {
                  setRole("");
                  setStatus("");
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
          <span className="font-medium text-telkom-grey-900">{users.length}</span> akun ditampilkan
        </p>
      </div>

      <div className="w-full px-4 pb-6 md:px-6">
        <div className="overflow-hidden rounded-xl bg-white shadow-sm shadow-black/5">
          {loading ? (
            <div className="px-5 py-12 text-center text-sm text-telkom-grey-500">
              Memuat daftar akun...
            </div>
          ) : error ? (
            <div className="px-5 py-12 text-center">
              <AlertCircle className="mx-auto size-8 text-telkom-grey-400" />
              <p className="mt-3 text-sm text-telkom-grey-600">{error}</p>
              <Button
                type="button"
                size="lg"
                className="mt-4 cursor-pointer bg-telkom-red hover:bg-telkom-red-dark"
                onClick={() => void load()}
              >
                Coba lagi
              </Button>
            </div>
          ) : users.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-telkom-grey-500">
              Tidak ada akun yang cocok dengan filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] text-left text-sm">
                <thead>
                  <tr className="border-b border-telkom-grey-100 bg-telkom-grey-50/80">
                    <th className="px-4 py-3 font-medium text-telkom-grey-600 md:px-5">Pengguna</th>
                    <th className="px-4 py-3 font-medium text-telkom-grey-600 md:px-5">Peran</th>
                    <th className="px-4 py-3 font-medium text-telkom-grey-600 md:px-5">Status</th>
                    <th className="px-4 py-3 font-medium text-telkom-grey-600 md:px-5">Total log</th>
                    <th className="px-4 py-3 font-medium text-telkom-grey-600 md:px-5">Bergabung</th>
                    <th className="px-4 py-3 font-medium text-telkom-grey-600 md:px-5">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-telkom-grey-100">
                  {users.map((user) => {
                    const isBusy = actionId === user.id;

                    return (
                      <tr key={user.id} className="transition-colors hover:bg-telkom-grey-50">
                        <td className="px-4 py-3.5 md:px-5">
                          <div className="flex items-center gap-3">
                            <MemberAvatar name={user.name || user.email} size="default" />
                            <div className="min-w-0">
                              <p className="truncate font-medium text-telkom-grey-900">
                                {user.name || "—"}
                              </p>
                              <p className="truncate text-xs text-telkom-grey-500">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 md:px-5">
                          <AppDropdown
                            value={user.role}
                            options={ROLE_CHANGE_OPTIONS}
                            disabled={isBusy || user.status === "deleted"}
                            onChange={(next) => void handleRoleChange(user, next)}
                            size="compact"
                          />
                        </td>
                        <td className="px-4 py-3.5 md:px-5">
                          <StatusBadge status={user.status} />
                        </td>
                        <td className="px-4 py-3.5 font-medium text-telkom-grey-900 md:px-5">
                          {user.audit.totalLogs}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-telkom-grey-500 md:px-5">
                          {formatActivityDate(user.createdAt)}
                        </td>
                        <td className="relative px-4 py-3.5 md:px-5">
                          <button
                            type="button"
                            disabled={isBusy || user.status === "deleted"}
                            onClick={() =>
                              setOpenMenuId((prev) => (prev === user.id ? null : user.id))
                            }
                            className="inline-flex size-8 cursor-pointer items-center justify-center rounded-sm text-telkom-grey-500 hover:bg-telkom-grey-100 disabled:opacity-50"
                          >
                            <MoreHorizontal className="size-4" />
                          </button>

                          {openMenuId === user.id ? (
                            <>
                              <div
                                className="fixed inset-0 z-40"
                                onClick={() => setOpenMenuId(null)}
                              />
                              <div className="absolute right-4 z-50 min-w-[160px] overflow-hidden rounded-sm border border-telkom-grey-200 bg-white py-1 shadow-md md:right-5">
                                {user.status === "active" ? (
                                  <button
                                    type="button"
                                    className="flex w-full cursor-pointer px-3 py-2 text-left text-xs text-telkom-grey-700 hover:bg-telkom-grey-50"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      void handleStatusToggle(user);
                                    }}
                                  >
                                    Nonaktifkan (dormant)
                                  </button>
                                ) : user.status === "deactivated" ? (
                                  <button
                                    type="button"
                                    className="flex w-full cursor-pointer px-3 py-2 text-left text-xs text-emerald-700 hover:bg-telkom-grey-50"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      void handleStatusToggle(user);
                                    }}
                                  >
                                    Aktifkan kembali
                                  </button>
                                ) : null}
                                <button
                                  type="button"
                                  className="flex w-full cursor-pointer px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    void handleDelete(user);
                                  }}
                                >
                                  Hapus (soft delete)
                                </button>
                              </div>
                            </>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* <p className="mt-3 text-xs text-telkom-grey-500">
          Peran saat ini: {USER_ROLE_LABELS.admin}, {USER_ROLE_LABELS.owner},{" "}
          {USER_ROLE_LABELS.viewer}, {USER_ROLE_LABELS.auditor}. Perubahan peran dan status
          tercatat di audit log.
        </p> */}
      </div>
    </div>
  );
}
