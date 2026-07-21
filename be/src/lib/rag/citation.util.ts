import type { TellsCitation } from "@/types/tells.types";

type CitationSource = TellsCitation & { refIndex: number };

export function buildCitationSources(
  hits: Array<{
    documentId: string;
    title: string;
    description: string | null;
    category: string | null;
    fileFormat: "pdf" | "docx";
    fileSizeBytes: string;
    status: string;
    score: number;
    snippet: string;
  }>
): CitationSource[] {
  return hits.map((hit, index) => ({
    refIndex: index + 1,
    documentId: hit.documentId,
    title: hit.title,
    description: hit.description,
    category: hit.category,
    fileFormat: hit.fileFormat,
    fileSizeBytes: hit.fileSizeBytes,
    status: hit.status,
    score: hit.score,
    snippet: hit.snippet,
  }));
}

export function resolveCitationsFromReply(
  reply: string,
  sources: CitationSource[],
  options?: { minAutoScore?: number }
) {
  const minAutoScore = options?.minAutoScore ?? 0.72;
  const referenced = new Set<number>();

  const markerPattern = /\[(\d{1,2})\]/g;
  let match: RegExpExecArray | null;
  while ((match = markerPattern.exec(reply)) !== null) {
    const index = Number(match[1]);
    if (sources.some((source) => source.refIndex === index)) {
      referenced.add(index);
    }
  }

  let citations = sources.filter((source) => referenced.has(source.refIndex));

  if (citations.length === 0) {
    citations = sources
      .filter((source) => source.score >= minAutoScore)
      .slice(0, 2);
  }

  return citations.map(({ refIndex, ...citation }) => ({
    ...citation,
    refIndex,
  }));
}
