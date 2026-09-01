"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  GitCommitHorizontal,
  RefreshCw,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { FilterDropdown } from "@/app/(app)/wiki/components/filter-dropdown";
import { AdminHeroBanner } from "@/app/admin/components/admin-hero-banner";
import { MemberAvatar } from "@/app/(app)/organizations/components/member-avatars";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { fetchAuditOverview } from "@/lib/api/audit/route";
import { formatActivityDate, formatRelativeTime } from "@/lib/organization-activity";
import type { AuditOverviewResponse } from "@/types/audit.types";
import { AUDIT_EVENT_LABELS, getAuditEventLabel } from "@/types/audit.types";
import { cn } from "@/lib/utils";

const AUDIT_CATEGORIES = [
  { value: "", label: "Semua kategori" },
  { value: "auth", label: "Autentikasi" },
  { value: "document", label: "Dokumen" },
  { value: "organization", label: "Organisasi" },
  { value: "access", label: "Hak akses" },
  { value: "tells", label: "TELLS" },
  { value: "ler", label: "LER" },
] as const;

const CATEGORY_TYPES: Record<string, string[]> = {
  auth: ["AUTH_LOGIN", "AUTH_LOGIN_FAILED", "AUTH_LOGOUT"],
  document: [
    "DOCUMENT_UPLOAD",
    "DOCUMENT_UPDATE",
    "DOCUMENT_DELETE",
    "DOCUMENT_DOWNLOAD",
  ],
  organization: [
    "ORGANIZATION_CREATE",
    "ORGANIZATION_UPDATE",
    "ORGANIZATION_DELETE",
    "ORGANIZATION_MEMBER_ADD",
    "ORGANIZATION_MEMBER_REMOVE",
  ],
  access: ["ACCESS_CHANGE"],
  tells: ["TELLS_QUERY"],
  ler: ["LER_PROCESS"],
};

const STATUS_OPTIONS = [
  { value: "", label: "Semua status" },
  { value: "success", label: "Berhasil" },
  { value: "failure", label: "Gagal" },
];

const EVENT_TYPE_OPTIONS = [
  { value: "", label: "Semua jenis" },
  ...Object.entries(AUDIT_EVENT_LABELS).map(([value, label]) => ({ value, label })),
];

export function AdminOverviewView() {
  const [overview, setOverview] = useState<AuditOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [eventType, setEventType] = useState("");
  const [status, setStatus] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchAuditOverview();
      if (!data) {
        setError(
          "Gagal memuat audit log. Periksa koneksi backend dan pastikan sudah login sebagai admin."
        );
        setOverview(null);
        return;
      }
      setOverview(data);
    } catch {
      setError("Terjadi kesalahan saat memuat audit log.");
      setOverview(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const recent = overview?.recent.data ?? [];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return recent.filter((item) => {
      if (status && item.status !== status) return false;

      if (eventType && item.eventType !== eventType) return false;

      if (category) {
        const types = CATEGORY_TYPES[category] ?? [];
        if (!types.includes(item.eventType)) return false;
      }

      if (!q) return true;

      const actor = (item.userName || item.userEmail || "Sistem").toLowerCase();
      return (
        actor.includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.eventType.toLowerCase().includes(q) ||
        getAuditEventLabel(item.eventType).toLowerCase().includes(q)
      );
    });
  }, [recent, query, category, eventType, status]);

  const stats = overview?.stats;
  const hasActiveFilters = Boolean(category || eventType || status);

  const statItems = [
    { label: "Total log", value: stats?.total ?? 0 },
    { label: "24 jam terakhir", value: stats?.last24h ?? 0 },
    { label: "Gagal (24 jam)", value: stats?.failed24h ?? 0 },
    { label: "Outbox pending", value: stats?.pendingOutbox ?? 0 },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-telkom-grey-50">
      <AdminHeroBanner
        eyebrow="Audit & Monitoring"
        title="Overview Aktivitas"
        loading={loading && !overview}
        stats={statItems.map((item) => ({ label: item.label, value: item.value }))}
      />

      <section className="border-b border-telkom-grey-100 bg-white px-4 py-3 md:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-telkom-grey-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari aktivitas, pengguna, atau event..."
              className="h-10 rounded-sm border-telkom-grey-200 bg-telkom-grey-50 pl-9 text-sm focus-visible:border-telkom-red focus-visible:ring-telkom-red/10"
            />
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <Button
              type="button"
              size="lg"
              variant="ghost"
              className={cn(
                "cursor-pointer gap-1.5 text-telkom-grey-600 hover:bg-telkom-grey-100",
                (showFilters || hasActiveFilters) && "bg-telkom-grey-100"
              )}
              onClick={() => setShowFilters((prev) => !prev)}
            >
              <SlidersHorizontal className="size-3.5" />
              Filter
            </Button>
            <Button
              type="button"
              size="lg"
              variant="ghost"
              className="cursor-pointer gap-1.5 text-telkom-grey-600 hover:bg-telkom-grey-100"
              onClick={() => void load()}
              disabled={loading}
            >
              <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
              Muat ulang
            </Button>
          </div>
        </div>

        <div
          className={cn(
            "flex flex-wrap items-center gap-2 transition-all duration-200",
            showFilters || hasActiveFilters
              ? "mt-3 max-h-20 opacity-100"
              : "max-h-0 overflow-hidden opacity-0"
          )}
        >
          <FilterDropdown
            label="Kategori"
            value={category}
            onChange={setCategory}
            options={[...AUDIT_CATEGORIES]}
          />
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
                setCategory("");
                setEventType("");
                setStatus("");
              }}
              className="cursor-pointer rounded-sm px-2 py-1.5 text-xs font-medium text-telkom-red hover:bg-telkom-red/5"
            >
              Reset filter
            </button>
          ) : null}
        </div>
      </section>

      {/* count */}
      <div className="flex items-center justify-between px-4 py-3 md:px-6">
        <p className="text-sm text-telkom-grey-600">
          <span className="font-medium text-telkom-grey-900">{filtered.length}</span>{" "}
          aktivitas audit terkini
        </p>
      </div>

      {/* log list */}
      <div className="w-full px-4 pb-6 md:px-6">
        <div className="overflow-hidden rounded-lg bg-white">
          {loading ? (
            <div className="px-5 py-12 text-center text-sm text-telkom-grey-500">
              Memuat audit log...
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
          ) : filtered.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-telkom-grey-500">
              {query || hasActiveFilters
                ? "Tidak ada aktivitas yang cocok dengan pencarian atau filter."
                : "Belum ada audit log masuk."}
            </div>
          ) : (
            <ul className="divide-y divide-telkom-grey-100">
              {filtered.map((item) => {
                const actor = item.userName || item.userEmail || "Sistem";

                return (
                  <li
                    key={item.id}
                    className="flex gap-4 px-4 py-4 transition-colors hover:bg-telkom-grey-50 md:px-5"
                  >
                    <MemberAvatar name={actor} size="default" className="shrink-0" />
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
                      <p className="mt-1.5 text-sm text-telkom-grey-900">
                        <span className="font-semibold">{actor}</span>{" "}
                        <span className="text-telkom-grey-700">{item.summary}</span>
                      </p>
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
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
