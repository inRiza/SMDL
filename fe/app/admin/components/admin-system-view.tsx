"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Server,
  Wifi,
  WifiOff,
} from "lucide-react";
import { AdminHeroBanner } from "@/app/admin/components/admin-hero-banner";
import { Button } from "@/components/ui/button";
import { fetchSystemHealth } from "@/lib/api/admin-system/route";
import type { SystemComponentHealth, SystemHealthResponse } from "@/types/admin-system.types";
import { SYSTEM_STATUS_LABELS } from "@/types/admin-system.types";
import { cn } from "@/lib/utils";

function StatusIcon({ status }: { status: SystemComponentHealth["status"] }) {
  if (status === "healthy") return <CheckCircle2 className="size-4 text-emerald-600" />;
  if (status === "degraded") return <AlertCircle className="size-4 text-amber-600" />;
  return <WifiOff className="size-4 text-red-600" />;
}

function ComponentCard({ item }: { item: SystemComponentHealth }) {
  const statusStyles = {
    healthy: "border-emerald-100 bg-emerald-50/40",
    degraded: "border-amber-100 bg-amber-50/40",
    down: "border-red-100 bg-red-50/40",
  };

  const badgeStyles = {
    healthy: "bg-emerald-50 text-emerald-700",
    degraded: "bg-amber-50 text-amber-700",
    down: "bg-red-50 text-red-700",
  };

  return (
    <article
      className={cn(
        "rounded-xl border bg-white p-4 shadow-sm shadow-black/5 transition-colors",
        statusStyles[item.status]
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 rounded-sm bg-white p-2 shadow-sm">
            {item.category === "infrastructure" ? (
              <Server className="size-4 text-telkom-grey-600" />
            ) : (
              <Wifi className="size-4 text-telkom-grey-600" />
            )}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-telkom-grey-900">{item.name}</h3>
            <p className="mt-0.5 truncate text-xs text-telkom-grey-500">{item.endpoint}</p>
          </div>
        </div>
        <StatusIcon status={item.status} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "rounded-sm px-2 py-0.5 text-[11px] font-medium",
            badgeStyles[item.status]
          )}
        >
          {SYSTEM_STATUS_LABELS[item.status]}
        </span>
        {item.latencyMs !== null ? (
          <span className="text-[11px] text-telkom-grey-500">{item.latencyMs} ms</span>
        ) : null}
      </div>

      <p className="mt-3 text-xs leading-relaxed text-telkom-grey-600">{item.message}</p>
    </article>
  );
}

export function AdminSystemView() {
  const [health, setHealth] = useState<SystemHealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchSystemHealth();
      if (!data) {
        setError("Gagal memuat status sistem.");
        setHealth(null);
        return;
      }
      setHealth(data);
    } catch {
      setError("Terjadi kesalahan saat memeriksa sistem.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const infra = useMemo(
    () => health?.components.filter((c) => c.category === "infrastructure") ?? [],
    [health]
  );
  const apis = useMemo(
    () => health?.components.filter((c) => c.category === "api") ?? [],
    [health]
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-telkom-grey-50">
      <AdminHeroBanner
        eyebrow="System Management"
        title="Status Sistem & API"
        description="Pantau kesehatan infrastruktur dan endpoint fitur SMDL secara real-time"
        loading={loading && !health}
        stats={[
          { label: "Total komponen", value: health?.summary.total ?? 0 },
          {
            label: "Healthy",
            value: health?.summary.healthy ?? 0,
            valueClassName: "text-emerald-600",
          },
          {
            label: "Degraded",
            value: health?.summary.degraded ?? 0,
            valueClassName: "text-amber-600",
          },
          {
            label: "Down",
            value: health?.summary.down ?? 0,
            valueClassName: "text-red-600",
          },
        ]}
      />

      <div className="flex items-center justify-between border-b border-telkom-grey-100 bg-white px-4 py-3 md:px-6">
        <p className="text-sm text-telkom-grey-600">
          Terakhir diperiksa:{" "}
          <span className="font-medium text-telkom-grey-900">
            {health?.summary.checkedAt
              ? new Date(health.summary.checkedAt).toLocaleString("id-ID")
              : "—"}
          </span>
        </p>
        <Button
          type="button"
          size="lg"
          variant="ghost"
          className="cursor-pointer gap-1.5 text-telkom-grey-600 hover:bg-telkom-grey-100"
          onClick={() => void load()}
          disabled={loading}
        >
          <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
          Periksa ulang
        </Button>
      </div>

      <div className="w-full px-4 py-6 md:px-6">
        {loading && !health ? (
          <div className="py-12 text-center text-sm text-telkom-grey-500">Memeriksa sistem...</div>
        ) : error ? (
          <div className="py-12 text-center">
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
        ) : (
          <div className="space-y-8">
            <section>
              <h2 className="mb-3 text-sm font-semibold text-telkom-grey-900">Infrastruktur</h2>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {infra.map((item) => (
                  <ComponentCard key={item.id} item={item} />
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-sm font-semibold text-telkom-grey-900">API & Fitur</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {apis.map((item) => (
                  <ComponentCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
