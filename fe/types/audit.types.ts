export type AuditEventStatus = "success" | "failure";

export type AuditEventItem = {
  id: string;
  eventId: string;
  eventType: string;
  service: string;
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
  aggregateId: string | null;
  aggregateType: string | null;
  requestId: string | null;
  ipAddress: string | null;
  status: AuditEventStatus;
  summary: string;
  payload: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  occurredAt: string;
};

export type AuditListResponse = {
  data: AuditEventItem[];
  nextCursor: string | null;
  hasMore: boolean;
};

export type AuditOverviewStats = {
  total: number;
  last24h: number;
  failed24h: number;
  pendingOutbox: number;
};

export type AuditOverviewResponse = {
  stats: AuditOverviewStats;
  recent: AuditListResponse;
};

export const AUDIT_EVENT_LABELS: Record<string, string> = {
  AUTH_LOGIN: "Login",
  AUTH_LOGIN_FAILED: "Login gagal",
  AUTH_LOGOUT: "Logout",
  DOCUMENT_UPLOAD: "Unggah dokumen",
  DOCUMENT_UPDATE: "Ubah dokumen",
  DOCUMENT_DELETE: "Hapus dokumen",
  DOCUMENT_DOWNLOAD: "Unduh dokumen",
  ACCESS_CHANGE: "Ubah hak akses",
  ORGANIZATION_CREATE: "Buat organisasi",
  ORGANIZATION_UPDATE: "Ubah organisasi",
  ORGANIZATION_DELETE: "Hapus organisasi",
  ORGANIZATION_MEMBER_ADD: "Tambah anggota",
  ORGANIZATION_MEMBER_REMOVE: "Hapus anggota",
  TELLS_QUERY: "TELLS query",
  LER_PROCESS: "Proses LER",
  USER_ROLE_CHANGED: "Ubah peran",
  USER_STATUS_CHANGED: "Ubah status akun",
  USER_DELETED: "Hapus akun",
};

export function getAuditEventLabel(eventType: string) {
  return AUDIT_EVENT_LABELS[eventType] ?? eventType;
}
