import { Queue, Worker, type Job } from "bullmq";
import { prismaClient, withPrismaRetry } from "@/lib/db/prisma";
import { extractLegalEntities } from "@/lib/ler/ler.service";
import { chunkText } from "@/lib/ler/text-extractor";
import { readStoredFile } from "@/lib/storage/file-storage";
import { setLerProgress, clearLerProgress } from "@/lib/ler/ler-progress";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";
const connection = { url: REDIS_URL };

export const LER_QUEUE_NAME = "ler-extraction";

let lerQueue: Queue | null = null;
let lerWorker: Worker | null = null;

export function getLerQueue() {
  if (!lerQueue) {
    lerQueue = new Queue(LER_QUEUE_NAME, { connection });
  }
  return lerQueue;
}

export async function enqueueLerExtraction(documentId: string) {
  setLerProgress(documentId, {
    stage: "queued",
    progress: 5,
    message: "Antrian ekstraksi LER",
  });

  const queue = getLerQueue();
  await queue.add(
    "extract",
    { documentId },
    {
      jobId: `ler-${documentId}`,
      removeOnComplete: true,
      removeOnFail: false,
      attempts: 1,
    }
  );
}

async function processLerJob(documentId: string) {
  const document = await prismaClient.document.findUnique({
    where: { id: documentId },
    select: {
      id: true,
      fileFormat: true,
      storageKey: true,
      title: true,
    },
  });

  if (!document) {
    throw new Error("Document not found");
  }

  setLerProgress(documentId, {
    stage: "parsing",
    progress: 25,
    message: "Mem-parse dokumen dengan Docling",
  });

  const buffer = await readStoredFile(document.storageKey);
  const filename = `${document.title}.${document.fileFormat}`;

  setLerProgress(documentId, {
    stage: "running_ler",
    progress: 55,
    message: "Menjalankan ekstraksi entitas (IndoBERT)",
  });

  const { entities, blocks, fullText, modelVersion } = await extractLegalEntities(
    buffer,
    filename,
    documentId,
  );

  if (!fullText.trim()) {
    throw new Error("Tidak ada teks yang dapat diekstrak dari dokumen");
  }

  setLerProgress(documentId, {
    stage: "saving",
    progress: 85,
    message: `Menyimpan hasil ekstraksi (${modelVersion})`,
  });

  const chunks = chunkText(fullText);

  await withPrismaRetry(() =>
    prismaClient.$transaction(
      async (tx) => {
        await tx.documentEntity.deleteMany({ where: { documentId } });
        await tx.documentChunk.deleteMany({ where: { documentId } });
        await tx.documentSection.deleteMany({ where: { documentId } });

        if (blocks.length > 0) {
          await tx.documentSection.createMany({
            data: blocks.map((block, orderIndex) => ({
              documentId,
              orderIndex,
              blockType: block.blockType,
              headingLevel: block.level,
              pageNumber: block.page,
              content: block.text,
            })),
          });
        }

        if (entities.length > 0) {
          await tx.documentEntity.createMany({
            data: entities.map((entity) => ({
              documentId,
              entityType: entity.entityType,
              entityValue: entity.entityValue,
              confidence: entity.confidence,
              sourceText: entity.sourceText ?? null,
            })),
          });
        }

        if (chunks.length > 0) {
          await tx.documentChunk.createMany({
            data: chunks.map((content, chunkIndex) => ({
              documentId,
              chunkIndex,
              content,
            })),
          });
        }

        await tx.document.update({
          where: { id: documentId },
          data: {
            status: "ready",
            lerExtractedAt: new Date(),
          },
        });
      },
      { timeout: 30_000, maxWait: 10_000 }
    )
  );

  setLerProgress(documentId, {
    stage: "done",
    progress: 100,
    message: "Ekstraksi LER selesai",
  });
}

async function handleLerFailure(documentId: string, error: unknown) {
  const message =
    error instanceof Error ? error.message : "Ekstraksi LER gagal";

  setLerProgress(documentId, {
    stage: "failed",
    progress: 100,
    message,
  });

  try {
    await withPrismaRetry(() =>
      prismaClient.document.update({
        where: { id: documentId },
        data: { status: "ler_failed" },
      })
    );
  } catch (updateError) {
    console.error("[ler-worker] could not mark document failed", updateError);
  }
}

export function startLerWorker() {
  if (lerWorker) return lerWorker;

  lerWorker = new Worker(
    LER_QUEUE_NAME,
    async (job: Job<{ documentId: string }>) => {
      const { documentId } = job.data;
      try {
        await processLerJob(documentId);
      } catch (error) {
        await handleLerFailure(documentId, error);
        throw error;
      } finally {
        setTimeout(() => clearLerProgress(documentId), 60_000);
      }
    },
    { connection, concurrency: 1 }
  );

  lerWorker.on("failed", (job, err) => {
    console.error("[ler-worker] job failed", job?.id, err.message);
  });

  console.log("[ler-worker] started");
  return lerWorker;
}

export function ensureLerWorker() {
  try {
    startLerWorker();
  } catch (error) {
    console.warn("[ler-worker] could not start", error);
  }
}

export async function runLerExtractionInline(documentId: string) {
  try {
    await processLerJob(documentId);
  } catch (error) {
    await handleLerFailure(documentId, error);
    throw error;
  }
}
