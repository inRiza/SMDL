import { randomUUID } from "node:crypto";
import { env } from "@/lib/config/env.config";
import { prismaClient } from "@/lib/db/prisma";
import type { AuditEventEnvelope, RecordAuditInput } from "./audit.types";

function createEventId() {
  return `evt_${randomUUID()}`;
}

export function buildAuditEnvelope(input: RecordAuditInput): AuditEventEnvelope {
  const eventId = createEventId();
  return {
    eventId,
    eventType: input.eventType,
    timestamp: new Date().toISOString(),
    service: "smdl-api",
    environment: env.NODE_ENV,
    userId: input.userId ?? null,
    userEmail: input.userEmail ?? null,
    userName: input.userName ?? null,
    aggregateId: input.aggregateId ?? null,
    aggregateType: input.aggregateType ?? null,
    requestId: input.requestId ?? null,
    ipAddress: input.ipAddress ?? null,
    status: input.status ?? "success",
    summary: input.summary,
    payload: input.payload ?? null,
    metadata: input.metadata ?? null,
  };
}

export async function recordAudit(input: RecordAuditInput) {
  const envelope = buildAuditEnvelope(input);
  const partitionKey = envelope.aggregateId ?? envelope.userId ?? envelope.eventId;

  await prismaClient.$transaction(async (tx) => {
    await tx.outboxEvent.create({
      data: {
        eventId: envelope.eventId,
        topic: env.KAFKA_TOPIC,
        partitionKey,
        payload: envelope,
      },
    });
  });

  return envelope;
}
