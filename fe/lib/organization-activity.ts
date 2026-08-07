import type { OrganizationActivityItem } from "@/types/organization.types";

export type ActivitySort = "newest" | "oldest";

export type ActivityListItem = Pick<
  OrganizationActivityItem,
  "id" | "actorName" | "action" | "summary" | "createdAt"
>;

export const ACTIVITY_SORT_OPTIONS = [
  { value: "newest", label: "Terbaru" },
  { value: "oldest", label: "Terlama" },
] as const;

export function formatActivityDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatRelativeTime(value: string) {
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "baru saja";
  if (minutes < 60) return `${minutes} mnt lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} hari lalu`;
  return formatActivityDate(value);
}

export function getActivityActorName(activity: ActivityListItem) {
  return activity.actorName.includes("@")
    ? activity.actorName.split("@")[0] ?? activity.actorName
    : activity.actorName;
}

export function searchAndSortActivities(
  activities: ActivityListItem[],
  query: string,
  sort: ActivitySort
) {
  const q = query.trim().toLowerCase();

  const filtered = activities.filter((activity) => {
    if (!q) return true;
    return (
      activity.summary.toLowerCase().includes(q) ||
      activity.actorName.toLowerCase().includes(q) ||
      activity.action.toLowerCase().includes(q) ||
      activity.id.toLowerCase().includes(q)
    );
  });

  return [...filtered].sort((a, b) => {
    const aTime = new Date(a.createdAt).getTime();
    const bTime = new Date(b.createdAt).getTime();
    return sort === "newest" ? bTime - aTime : aTime - bTime;
  });
}
