import { Prisma } from "@prisma/client";
import { env } from "@/lib/config/env.config";
import { isPrismaTransientError, prismaClient } from "@/lib/db/prisma";
import { getKafkaProducer } from "./kafka.client";

const POLL_MS = 2_000;
const BATCH_SIZE = 50;
const MAX_ATTEMPTS = 5;

let workerTimer: ReturnType<typeof setInterval> | null = null;
let producerConnected = false;
let producer = getKafkaProducer();

function hasOutboxModel() {
  return Prisma.dmmf.datamodel.models.some((model) => model.name === "OutboxEvent");
}

async function ensureProducer() {
  if (!producerConnected) {
    await producer.connect();
    producerConnected = true;
  }
}

async function publishPendingOutbox() {
  if (!hasOutboxModel()) {
    console.warn("[outbox] model belum tersedia, jalankan: bun run db:push");
    return;
  }

  const pending = await prismaClient.outboxEvent.findMany({
    where: {
      status: "pending",
      attempts: { lt: MAX_ATTEMPTS },
    },
    orderBy: { createdAt: "asc" },
    take: BATCH_SIZE,
  });

  if (pending.length === 0) return;

  await ensureProducer();

  for (const row of pending) {
    try {
      await producer.send({
        topic: row.topic,
        messages: [
          {
            key: row.partitionKey ?? row.eventId,
            value: JSON.stringify(row.payload),
            headers: {
              eventId: row.eventId,
              eventType: String(
                (row.payload as { eventType?: string }).eventType ?? "UNKNOWN"
              ),
            },
          },
        ],
      });

      await prismaClient.outboxEvent.update({
        where: { id: row.id },
        data: {
          status: "published",
          publishedAt: new Date(),
          lastError: null,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown publish error";
      await prismaClient.outboxEvent.update({
        where: { id: row.id },
        data: {
          attempts: { increment: 1 },
          lastError: message,
          status: row.attempts + 1 >= MAX_ATTEMPTS - 1 ? "failed" : "pending",
        },
      });
      console.warn("[outbox] publish failed", { eventId: row.eventId, message });
    }
  }
}

export function startOutboxWorker() {
  if (workerTimer) return;

  workerTimer = setInterval(() => {
    void publishPendingOutbox().catch((error) => {
      if (isPrismaTransientError(error)) {
        console.warn("[outbox] prisma belum siap, skip poll");
        return;
      }
      console.error("[outbox] worker error", error);
    });
  }, POLL_MS);

  void publishPendingOutbox().catch((error) => {
    if (isPrismaTransientError(error)) {
      console.warn("[outbox] prisma belum siap, skip poll");
      return;
    }
    console.error("[outbox] initial poll error", error);
  });

  console.log("[outbox] worker started");
}

export async function stopOutboxWorker() {
  if (workerTimer) {
    clearInterval(workerTimer);
    workerTimer = null;
  }
  if (producerConnected) {
    await producer.disconnect();
    producerConnected = false;
  }
}
