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
}
