"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, GitCommitHorizontal, Search } from "lucide-react";
import { FilterDropdown } from "@/app/(app)/wiki/components/filter-dropdown";
import { Input } from "@/components/ui/input";
import { MemberAvatar } from "@/app/(app)/organizations/components/member-avatars";
import {
  ACTIVITY_SORT_OPTIONS,
  formatActivityDate,
  formatRelativeTime,
  getActivityActorName,
  searchAndSortActivities,
  type ActivitySort,
} from "@/lib/organization-activity";
import type { DocumentWorkspace } from "@/types/document.types";

type DocumentActivityViewProps = {
  workspace: DocumentWorkspace;
};

export function DocumentActivityView({ workspace }: DocumentActivityViewProps) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<ActivitySort>("newest");

  const filtered = useMemo(
    () => searchAndSortActivities(workspace.activities, query, sort),
    [workspace.activities, query, sort]
  );

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <div className="bg-white px-4 py-3 md:px-6">
        <Link
          href="/documents"
          className="inline-flex size-7 items-center justify-center rounded-lg text-telkom-grey-600 transition-colors hover:bg-telkom-grey-100"
        >
          <ArrowLeft className="size-4" />
        </Link>
      </div>

      <section className="border-b border-telkom-grey-100 bg-white px-4 pb-5 md:px-6">
        <h1 className="mt-1 text-2xl font-semibold text-telkom-grey-900 md:text-3xl">
          Dokumen Saya
        </h1>
        <p className="mt-1 text-sm text-telkom-grey-500">Catatan riwayat aktivitas dokumen</p>
      </section>

      <div className="flex-1 bg-telkom-grey-50 px-4 py-6 md:px-6">
        <div className="overflow-hidden rounded-md bg-white">
          <div className="border-b border-telkom-grey-100 px-4 py-3 md:px-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-telkom-grey-400" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari aktivitas, aktor, atau hash..."
                  className="h-9 bg-telkom-grey-50 pl-9"
                />
              </div>
              <FilterDropdown
                label="Urutkan"
                value={sort}
                onChange={(value) => setSort(value as ActivitySort)}
                options={[...ACTIVITY_SORT_OPTIONS]}
              />
            </div>
            <p className="mt-6 text-xs text-telkom-grey-500">
              Menampilkan {filtered.length} dari {workspace.activities.length} aktivitas
            </p>
          </div>

          {filtered.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-telkom-grey-500">
              Tidak ada aktivitas yang cocok dengan pencarian.
            </div>
          ) : (
            <ul className="divide-y divide-telkom-grey-100">
              {filtered.map((activity) => {
                const actorName = getActivityActorName(activity);

                return (
                  <li
                    key={activity.id}
                    className="flex gap-4 px-4 py-4 transition-colors hover:bg-telkom-grey-50 md:px-5"
                  >
                    <MemberAvatar name={actorName} size="default" className="shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-telkom-grey-900">
                        <span className="font-semibold">{actorName}</span>{" "}
                        <span className="text-telkom-grey-700">{activity.summary}</span>
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-telkom-grey-500">
                        <span className="inline-flex items-center gap-1">
                          <GitCommitHorizontal className="size-3" />
                          <span className="font-mono">{activity.id.slice(0, 7)}</span>
                        </span>
                        <span title={formatActivityDate(activity.createdAt)}>
                          {formatRelativeTime(activity.createdAt)}
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
