import { prismaClient } from "@/lib/db/prisma";
import type { TellsCitation } from "@/types/tells.types";
import { extractSearchTerms } from "./query.util";

type CatalogDocument = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  fileFormat: "pdf" | "docx";
  fileSizeBytes: string;
  status: string;
  createdAt: Date;
};

function toCitation(doc: CatalogDocument, refIndex: number, snippet?: string): TellsCitation {
  return {
    refIndex,
    documentId: doc.id,
    title: doc.title,
    description: doc.description,
    category: doc.category,
    fileFormat: doc.fileFormat,
    fileSizeBytes: doc.fileSizeBytes,
    status: doc.status,
    score: 1,
    snippet: snippet ?? doc.description?.slice(0, 180) ?? doc.title,
  };
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export class DocumentCatalogService {
  async getLatest(limit = 3) {
    const rows = await prismaClient.document.findMany({
      where: {
        status: { in: ["ready", "ler_failed", "processing"] },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        fileFormat: true,
        fileSizeBytes: true,
        status: true,
        createdAt: true,
      },
    });

    return rows.map((row) => ({
      ...row,
      fileSizeBytes: row.fileSizeBytes.toString(),
    }));
  }

  async searchMetadata(query: string, limit = 5) {
    const terms = extractSearchTerms(query);

    const rows = await prismaClient.document.findMany({
      where: {
        status: { in: ["ready", "ler_failed"] },
        OR:
          terms.length > 0
            ? terms.flatMap((term) => [
                { title: { contains: term, mode: "insensitive" as const } },
                { description: { contains: term, mode: "insensitive" as const } },
                { category: { contains: term, mode: "insensitive" as const } },
              ])
            : [
                { title: { contains: query, mode: "insensitive" as const } },
                { description: { contains: query, mode: "insensitive" as const } },
              ],
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        fileFormat: true,
        fileSizeBytes: true,
        status: true,
        createdAt: true,
      },
    });

    return rows.map((row) => ({
      ...row,
      fileSizeBytes: row.fileSizeBytes.toString(),
    }));
  }

  async countDocuments() {
    return prismaClient.document.count({
      where: { status: { in: ["ready", "ler_failed", "processing"] } },
    });
  }

  buildLatestReply(docs: CatalogDocument[], includeGreeting = false) {
    if (docs.length === 0) {
      return "Belum ada dokumen di SMDL.";
    }

    const latest = docs[0];
    const greeting = includeGreeting ? "Halo! " : "";
    const others =
      docs.length > 1
        ? ` Dokumen lain yang baru diunggah: ${docs
            .slice(1)
            .map((doc) => doc.title)
            .join(", ")}.`
        : "";

    return `${greeting}Dokumen terbaru di SMDL adalah "${latest.title}" (${latest.category ?? "Tanpa kategori"}, diunggah ${formatDate(latest.createdAt)}).${others}`;
  }

  buildListReply(docs: CatalogDocument[], total: number, includeGreeting = false) {
    if (docs.length === 0) {
      return "Belum ada dokumen di SMDL.";
    }

    const greeting = includeGreeting ? "Halo! " : "";
    const summary = docs
      .map((doc, index) => `[${index + 1}] ${doc.title} (${doc.category ?? "Tanpa kategori"})`)
      .join("\n");

    return `${greeting}Saat ini ada ${total} dokumen di SMDL. Berikut beberapa dokumen terbaru:\n${summary}`;
  }

  docsToCitations(docs: CatalogDocument[]): TellsCitation[] {
    return docs.map((doc, index) => toCitation(doc, index + 1));
  }
}
