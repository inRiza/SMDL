export type UserRiskLevel = "low" | "medium" | "high";

export type UserAccountStatus = "active" | "deactivated" | "deleted";

export type AdminUserAuditSummary = {
  totalLogs: number;
  failedLogs: number;
  failedLogs24h: number;
  loginFailedCount: number;
  lastActivityAt: string | null;
  riskLevel: UserRiskLevel;
};

export type AdminUserListItem = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "owner" | "viewer" | "auditor";
  status: UserAccountStatus;
  deactivatedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  audit: AdminUserAuditSummary;
};

export type AdminUserDetail = AdminUserListItem & {
  updatedAt: string;
  audit: AdminUserAuditSummary & {
    logs24h: number;
    lastLoginAt: string | null;
    lastLoginIp: string | null;
  };
};

export type AdminUserListResponse = {
  data: AdminUserListItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type AdminUserListFilters = {
  q?: string;
  role?: AdminUserListItem["role"];
  status?: UserAccountStatus;
  page?: number;
  limit?: number;
  sort?: "name_asc" | "name_desc" | "logs_desc" | "failed_desc" | "activity_desc";
};

export const USER_STATUS_LABELS: Record<UserAccountStatus, string> = {
  active: "Aktif",
  deactivated: "Dormant",
  deleted: "Dihapus",
};

export const USER_ROLE_LABELS: Record<AdminUserListItem["role"], string> = {
  admin: "Administrator",
  owner: "Owner",
  viewer: "Viewer",
  auditor: "Auditor",
};

export const RISK_LABELS: Record<UserRiskLevel, string> = {
  low: "Rendah",
  medium: "Sedang",
  high: "Tinggi",
};
