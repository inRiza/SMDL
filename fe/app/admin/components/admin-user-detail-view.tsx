"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  GitCommitHorizontal,
} from "lucide-react";
import { FilterDropdown } from "@/app/(app)/wiki/components/filter-dropdown";
import { AdminHeroBanner } from "@/app/admin/components/admin-hero-banner";
import { AdminSearchSection } from "@/app/admin/components/admin-search-section";
import { MemberAvatar } from "@/app/(app)/organizations/components/member-avatars";
import { fetchAdminUserDetail } from "@/lib/api/admin-user/route";
import { fetchAuditLogs } from "@/lib/api/audit/route";
import { formatActivityDate, formatRelativeTime } from "@/lib/organization-activity";
import type { AuditEventItem } from "@/types/audit.types";
import { AUDIT_EVENT_LABELS, getAuditEventLabel } from "@/types/audit.types";
import type { AdminUserDetail } from "@/types/admin-user.types";
import { RISK_LABELS, USER_ROLE_LABELS } from "@/types/admin-user.types";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS = [
  { value: "", label: "Semua status" },
  { value: "success", label: "Berhasil" },
  { value: "failure", label: "Gagal" },
];

const EVENT_TYPE_OPTIONS = [
  { value: "", label: "Semua jenis" },
  ...Object.entries(AUDIT_EVENT_LABELS).map(([value, label]) => ({ value, label })),
];

type AdminUserDetailViewProps = {
  userId: string;
};

export function AdminUserDetailView({ userId }: AdminUserDetailViewProps) {
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [logs, setLogs] = useState<AuditEventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [eventType, setEventType] = useState("");
  const [status, setStatus] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [userData, logData] = await Promise.all([
        fetchAdminUserDetail(userId),
        fetchAuditLogs({ userId, limit: 50 }),
      ]);

      if (!userData) {
        setError("Pengguna tidak ditemukan atau akses ditolak.");
        setUser(null);
        setLogs([]);
        return;
      }

      setUser(userData);
      setLogs(logData?.data ?? []);
    } catch {
      setError("Terjadi kesalahan saat memuat detail pengguna.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredLogs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return logs.filter((item) => {
      if (status && item.status !== status) return false;
      if (eventType && item.eventType !== eventType) return false;
      if (!q) return true;
      return (
        item.summary.toLowerCase().includes(q) ||
        item.eventType.toLowerCase().includes(q) ||
        getAuditEventLabel(item.eventType).toLowerCase().includes(q)
      );
    });
  }, [logs, query, status, eventType]);

  const hasActiveFilters = Boolean(eventType || status);

  if (loading && !user) {
    return (
      <div className="flex flex-1 items-center justify-center bg-telkom-grey-50 p-8 text-sm text-telkom-grey-500">
        Memuat detail pengguna...
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-telkom-grey-50 p-8">
        <AlertCircle className="size-8 text-telkom-grey-400" />
        <p className="text-sm text-telkom-grey-600">{error ?? "Pengguna tidak ditemukan."}</p>
        <Link
          href="/admin/users"
          className="text-sm font-medium text-telkom-red hover:underline"
        >
          Kembali ke daftar user
        </Link>
      </div>
    );
  }

  const riskStyles = {
    low: "text-emerald-600",
    medium: "text-amber-600",
    high: "text-red-600",
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-telkom-grey-50">
      <div className="bg-white px-4 py-3 md:px-6">
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-1.5 text-sm text-telkom-grey-600 transition-colors hover:text-telkom-grey-900"
        >
          <ArrowLeft className="size-4" />
          Kembali ke daftar user
        </Link>
      </div>

      <AdminHeroBanner
        eyebrow="Detail Pengguna"
        title={user.name || user.email}
        description={`${user.email} · ${USER_ROLE_LABELS[user.role]}`}
        stats={[
          { label: "Total log", value: user.audit.totalLogs },
          { label: "Log 24 jam", value: user.audit.logs24h },
          { label: "Log gagal", value: user.audit.failedLogs },
          { label: "Login gagal", value: user.audit.loginFailedCount },
          {
            label: "Tingkat risiko",
            value: RISK_LABELS[user.audit.riskLevel],
            valueClassName: riskStyles[user.audit.riskLevel],
          },
        ]}
      />

      <div className="border-b border-telkom-grey-100 bg-white px-4 py-3 md:px-6">
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-telkom-grey-500">
          <span>
            Aktivitas terakhir:{" "}
            <span className="font-medium text-telkom-grey-700">
              {user.audit.lastActivityAt
                ? formatRelativeTime(user.audit.lastActivityAt)
                : "—"}
            </span>
          </span>
          <span>
            Login terakhir:{" "}
            <span className="font-medium text-telkom-grey-700">
              {user.audit.lastLoginAt ? formatRelativeTime(user.audit.lastLoginAt) : "—"}
            </span>
          </span>
          {user.audit.lastLoginIp ? (
            <span>
              IP terakhir:{" "}
              <span className="font-medium text-telkom-grey-700">{user.audit.lastLoginIp}</span>
            </span>
          ) : null}
        </div>
      </div>

      <AdminSearchSection
        query={query}
        onQueryChange={setQuery}
        placeholder="Cari log aktivitas pengguna..."
        loading={loading}
        onRefresh={() => void load()}
        onToggleFilters={() => setShowFilters((prev) => !prev)}
        filtersOpen={showFilters}
        hasActiveFilters={hasActiveFilters}
        filters={
          <>
            <FilterDropdown
              label="Jenis"
              value={eventType}
              onChange={setEventType}
              options={EVENT_TYPE_OPTIONS}
            />
            <FilterDropdown
              label="Status"
              value={status}
              onChange={setStatus}
              options={STATUS_OPTIONS}
            />
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={() => {
                  setEventType("");
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
          <span className="font-medium text-telkom-grey-900">{filteredLogs.length}</span> log
          aktivitas
        </p>
      </div>

      <div className="w-full px-4 pb-6 md:px-6">
        <div className="overflow-hidden rounded-xl bg-white shadow-sm shadow-black/5">
          {filteredLogs.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-telkom-grey-500">
              {query || hasActiveFilters
                ? "Tidak ada log yang cocok dengan filter."
                : "Belum ada audit log untuk pengguna ini."}
            </div>
          ) : (
            <ul className="divide-y divide-telkom-grey-100">
              {filteredLogs.map((item) => (
                <li
                  key={item.id}
                  className="flex gap-4 px-4 py-4 transition-colors hover:bg-telkom-grey-50 md:px-5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-sm bg-telkom-grey-100 px-2 py-0.5 text-[11px] font-medium text-telkom-grey-700">
                        {getAuditEventLabel(item.eventType)}
                      </span>
                      {item.status === "success" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600">
                          <CheckCircle2 className="size-3" />
                          Berhasil
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-amber-600">
                          <AlertCircle className="size-3" />
                          Gagal
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 text-sm text-telkom-grey-900">{item.summary}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-telkom-grey-500">
                      <span className="inline-flex items-center gap-1">
                        <GitCommitHorizontal className="size-3" />
                        <span className="font-mono">{item.eventId.slice(0, 12)}</span>
                      </span>
                      {item.ipAddress ? <span>IP {item.ipAddress}</span> : null}
                      <span title={formatActivityDate(item.occurredAt)}>
                        {formatRelativeTime(item.occurredAt)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
