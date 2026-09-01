import { z } from "zod";
import { env } from "@/lib/config/env.config";
import { prismaClient } from "@/lib/db/prisma";
import type { AuditEventEnvelope } from "@/lib/audit/audit.types";
import { ResourceIdSchema } from "@/validators/id.validator";
import { getKafkaConsumer } from "./kafka.client";

const envelopeSchema = z.object({
  eventId: z.string().min(1),
  eventType: z.string().min(1),
  timestamp: z.string().datetime(),
  service: z.string().min(1),
  environment: z.string().min(1),
  userId: ResourceIdSchema.nullable().optional(),
  userEmail: z.string().nullable().optional(),
  userName: z.string().nullable().optional(),
  aggregateId: z.string().nullable().optional(),
  aggregateType: z.string().nullable().optional(),
  requestId: z.string().nullable().optional(),
  ipAddress: z.string().nullable().optional(),
  status: z.enum(["success", "failure"]),
  summary: z.string().min(1),
  payload: z.record(z.string(), z.unknown()).nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
});

let consumerRunning = false;

async function processEnvelope(envelope: AuditEventEnvelope) {
  const existing = await prismaClient.processedEvent.findUnique({
    where: { eventId: envelope.eventId },
  });
  if (existing) return;

  try {
    await prismaClient.$transaction(async (tx) => {
      await tx.processedEvent.create({
        data: { eventId: envelope.eventId },
      });

      await tx.auditEvent.create({
        data: {
          eventId: envelope.eventId,
          eventType: envelope.eventType,
          service: envelope.service,
          userId: envelope.userId ?? null,
          userEmail: envelope.userEmail ?? null,
          userName: envelope.userName ?? null,
          aggregateId: envelope.aggregateId ?? null,
          aggregateType: envelope.aggregateType ?? null,
          requestId: envelope.requestId ?? null,
          ipAddress: envelope.ipAddress ?? null,
          status: envelope.status,
          summary: envelope.summary,
          payload: envelope.payload ?? undefined,
          metadata: envelope.metadata ?? undefined,
          occurredAt: new Date(envelope.timestamp),
        },
      });
    });
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      return;
    }
    throw error;
  }
}

export async function startAuditConsumer() {
  if (consumerRunning) return;

  const consumer = getKafkaConsumer(env.KAFKA_CONSUMER_GROUP);

  try {
    await consumer.connect();
    await consumer.subscribe({ topic: env.KAFKA_TOPIC, fromBeginning: false });

    await consumer.run({
      eachMessage: async ({ message }) => {
        if (!message.value) return;

        let raw: unknown;
        try {
          raw = JSON.parse(message.value.toString());
        } catch {
          console.warn("[audit-consumer] malformed json");
          return;
        }

        const parsed = envelopeSchema.safeParse(raw);
        if (!parsed.success) {
          console.warn("[audit-consumer] invalid envelope", parsed.error.flatten());
          return;
        }

        await processEnvelope(parsed.data);
      },
    });

    consumerRunning = true;
    console.log("[audit-consumer] started");
  } catch (error) {
    await consumer.disconnect().catch(() => undefined);
    throw error;
  }
}
