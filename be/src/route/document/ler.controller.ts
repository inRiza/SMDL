import type { Context } from "hono";
import { streamSSE } from "hono/streaming";
import { getRequestUserId } from "@/lib/auth/request-user";
import { getLerProgress, subscribeLerProgress } from "@/lib/ler/ler-progress";
import { resolveLerStatus } from "@/lib/ler/resolve-ler-status";
import { DocumentRepository } from "../document/document.repository";
import { DocumentService } from "../document/document.service";

export class LerController {
  constructor(
    private readonly documentService: DocumentService = new DocumentService(),
    private readonly repository: DocumentRepository = new DocumentRepository()
  ) {}

  getStatus = async (c: Context) => {
    const userId = getRequestUserId(c) ?? undefined;
    const id = c.req.param("id");
    if (!id) return c.json({ error: "Document id is required" }, 400);

    const document = await this.documentService.getDocumentById(id, userId);
    if (document === "forbidden") return c.json({ error: "Forbidden" }, 403);
    if (!document) return c.json({ error: "Document not found" }, 404);

    const progress = getLerProgress(id);

    return c.json({
      documentId: id,
      lerStatus: document.lerStatus,
      progress: progress ?? null,
      lerEntities: document.lerEntities,
      lerExtractedAt: document.lerExtractedAt,
      status: document.status,
    });
  };

  stream = async (c: Context) => {
    const userId = getRequestUserId(c) ?? undefined;
    const id = c.req.param("id");
    if (!id) return c.json({ error: "Document id is required" }, 400);

    const document = await this.documentService.getDocumentById(id, userId);
    if (document === "forbidden") return c.json({ error: "Forbidden" }, 403);
    if (!document) return c.json({ error: "Document not found" }, 404);

    return streamSSE(c, async (stream) => {
      let done = false;

      const unsubscribe = subscribeLerProgress(id, async (progress) => {
        await stream.writeSSE({
          event: "progress",
          data: JSON.stringify(progress),
        });

        if (progress.stage === "done" || progress.stage === "failed") {
          done = true;
          const latest = await this.documentService.getDocumentById(id, userId);
          if (latest && latest !== "forbidden") {
            await stream.writeSSE({
              event: "complete",
              data: JSON.stringify({
                lerStatus: latest.lerStatus,
                lerEntities: latest.lerEntities,
                lerExtractedAt: latest.lerExtractedAt,
                status: latest.status,
              }),
            });
          }
        }
      });

      while (!done) {
        if (stream.closed) break;
        await stream.sleep(1000);
        const latest = await this.documentService.getDocumentById(id, userId);
        if (
          latest &&
          latest !== "forbidden" &&
          latest.lerStatus !== "pending"
        ) {
          done = true;
          await stream.writeSSE({
            event: "complete",
            data: JSON.stringify({
              lerStatus: latest.lerStatus,
              lerEntities: latest.lerEntities,
              lerExtractedAt: latest.lerExtractedAt,
              status: latest.status,
            }),
          });
        }
      }

      unsubscribe();
    });
  };

  generate = async (c: Context) => {
    const userId = getRequestUserId(c);
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const id = c.req.param("id");
    if (!id) return c.json({ error: "Document id is required" }, 400);

    const document = await this.documentService.getDocumentById(id, userId);
    if (document === "forbidden") return c.json({ error: "Forbidden" }, 403);
    if (!document) return c.json({ error: "Document not found" }, 404);

    if (document.ownerId !== userId) {
      return c.json({ error: "Forbidden" }, 403);
    }

    // live progress only exists while a job runs in this process; without it a
    // "processing" document is a leftover from a crash/restart and can be re-run
    const isRunning = document.lerStatus === "pending" && getLerProgress(id) !== null;
    if (isRunning) {
      return c.json({ error: "Ekstraksi LER sedang berjalan" }, 409);
    }

    const result = await this.repository.startLerGeneration(id, userId, {
      force: document.lerStatus === "pending",
    });
    if (result === "not_found") {
      return c.json({ error: "Document not found" }, 404);
    }
    if (result === "already_processing") {
      return c.json({ error: "Ekstraksi LER sedang berjalan" }, 409);
    }

    return c.json({
      ok: true,
      lerStatus: "pending" as const,
    });
  };

  retry = async (c: Context) => {
    return this.generate(c);
  };
}

export { resolveLerStatus };
