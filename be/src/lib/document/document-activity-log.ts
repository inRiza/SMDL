import { AUDIT_EVENT_TYPES } from "@/lib/audit/audit-event-types";
import { recordAudit } from "@/lib/audit/record-audit";
import { prismaClient } from "@/lib/db/prisma";

type RecordDocumentActivityInput = {
  documentId: string;
  actorId?: string | null;
  actorName: string;
  action: string;
  summary: string;
  metadata?: Record<string, unknown>;
};

export async function recordDocumentActivity(input: RecordDocumentActivityInput) {
  await prismaClient.documentActivity.create({
    data: {
      documentId: input.documentId,
      actorId: input.actorId ?? null,
      actorName: input.actorName,
      action: input.action,
      summary: input.summary,
      metadata: input.metadata ?? undefined,
    },
  });

  const eventTypeByAction: Record<string, string> = {
    "document.uploaded": AUDIT_EVENT_TYPES.DOCUMENT_UPLOAD,
    "document.updated": AUDIT_EVENT_TYPES.DOCUMENT_UPDATE,
    "document.revoked": AUDIT_EVENT_TYPES.DOCUMENT_DELETE,
  };

  const eventType = eventTypeByAction[input.action];
  if (!eventType) return;

  void recordAudit({
    eventType,
    summary: input.summary,
    userId: input.actorId ?? null,
    userName: input.actorName,
    userEmail: input.actorName.includes("@") ? input.actorName : null,
    aggregateId: input.documentId,
    aggregateType: "document",
    metadata: {
      action: input.action,
      ...(input.metadata ?? {}),
    },
  }).catch((error) => {
    console.error("[audit] document activity record error", error);
  });
}
