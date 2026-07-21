import { prismaClient } from "@/lib/db/prisma";
import { extractSearchTerms } from "./query.util";

const MIN_RELEVANCE_SCORE = 0.28;
const MAX_CONTEXT_CHUNKS = 6;

export type RetrievalHit = {
  chunkId: string;
  documentId: string;
  title: string;
  description: string | null;
  category: string | null;
  fileFormat: "pdf" | "docx";
  fileSizeBytes: string;
  status: string;
  snippet: string;
  score: number;
  content: string;
};

function countTermMatches(text: string, terms: string[]) {
  if (terms.length === 0) return 0;
  const lower = text.toLowerCase();
  return terms.filter((term) => lower.includes(term)).length;
}

function scoreChunk(input: {
  content: string;
  title: string;
  description: string | null;
  terms: string[];
  rawQuery: string;
}) {
  const { content, title, description, terms, rawQuery } = input;
  const lowerContent = content.toLowerCase();
  const lowerTitle = title.toLowerCase();
  const lowerDescription = description?.toLowerCase() ?? "";
  const lowerQuery = rawQuery.toLowerCase();

  const termMatches = countTermMatches(content, terms);
  const termCoverage =
    terms.length > 0 ? termMatches / terms.length : lowerContent.includes(lowerQuery) ? 1 : 0;

  const titleMatch = terms.some((term) => lowerTitle.includes(term)) ? 1 : 0;
  const titleContainsQuery = lowerTitle.includes(lowerQuery) ? 1 : 0;
  const descriptionMatch = terms.some((term) => lowerDescription.includes(term)) ? 1 : 0;
  const phraseMatch = lowerContent.includes(lowerQuery) ? 1 : 0;

  const score =
    termCoverage * 0.45 +
    titleMatch * 0.2 +
    titleContainsQuery * 0.15 +
    descriptionMatch * 0.1 +
    phraseMatch * 0.1;

  return Math.min(1, Number(score.toFixed(3)));
}

export class RetrievalService {
  async search(query: string): Promise<RetrievalHit[]> {
    const terms = extractSearchTerms(query);
    const searchTerms = terms.length > 0 ? terms : [query.trim().toLowerCase()].filter(Boolean);

    const chunks = await prismaClient.documentChunk.findMany({
      where: {
        OR:
          searchTerms.length > 0
            ? searchTerms.flatMap((term) => [
                { content: { contains: term, mode: "insensitive" as const } },
                { document: { title: { contains: term, mode: "insensitive" as const } } },
                { document: { description: { contains: term, mode: "insensitive" as const } } },
              ])
            : [{ content: { contains: query, mode: "insensitive" as const } }],
        document: {
          status: { in: ["ready", "ler_failed"] },
        },
      },
      take: 40,
      include: {
        document: {
          select: {
            id: true,
            title: true,
            description: true,
            category: true,
            fileFormat: true,
            fileSizeBytes: true,
            status: true,
          },
        },
      },
      orderBy: {
        chunkIndex: "asc",
      },
    });

    const scored = chunks
      .map((chunk) => {
        const score = scoreChunk({
          content: chunk.content,
          title: chunk.document.title,
          description: chunk.document.description,
          terms: searchTerms,
          rawQuery: query,
        });

        return {
          chunkId: chunk.id,
          documentId: chunk.document.id,
          title: chunk.document.title,
          description: chunk.document.description,
          category: chunk.document.category,
          fileFormat: chunk.document.fileFormat,
          fileSizeBytes: chunk.document.fileSizeBytes.toString(),
          status: chunk.document.status,
          snippet: chunk.content.slice(0, 180),
          score,
          content: chunk.content,
        };
      })
      .filter((hit) => hit.score >= MIN_RELEVANCE_SCORE)
      .sort((a, b) => b.score - a.score);

    const byDoc = new Map<string, RetrievalHit>();

    for (const hit of scored) {
      const existing = byDoc.get(hit.documentId);
      if (!existing || hit.score > existing.score) {
        byDoc.set(hit.documentId, hit);
      }
    }

    return Array.from(byDoc.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_CONTEXT_CHUNKS);
  }
}
