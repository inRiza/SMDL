import type { AuditEventStatus } from "@prisma/client";
import type { AuditEventType } from "./audit-event-types";

export type AuditEventEnvelope = {
  eventId: string;
  eventType: AuditEventType | string;
  timestamp: string;
  service: string;
  environment: string;
  userId?: string | null;
  userEmail?: string | null;
  userName?: string | null;
  aggregateId?: string | null;
  aggregateType?: string | null;
  requestId?: string | null;
  ipAddress?: string | null;
  status: AuditEventStatus;
  summary: string;
  payload?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
};

export type RecordAuditInput = {
  eventType: AuditEventType | string;
  summary: string;
  status?: AuditEventStatus;
  userId?: string | null;
  userEmail?: string | null;
  userName?: string | null;
  aggregateId?: string | null;
  aggregateType?: string | null;
  requestId?: string | null;
  ipAddress?: string | null;
  payload?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
};
