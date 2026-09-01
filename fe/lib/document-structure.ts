import type { DocumentSection } from "@/types/document.types";

export type StructureNode = {
  id: string;
  /** 1 = bab, 2 = bagian, 3 = pasal, 0 = badan teks */
  level: number;
  text: string;
  pageNumber: number;
  blockType: DocumentSection["blockType"];
};

/**
 * Docling only labels headings when the source PDF carries real style info.
 * Indonesian legal documents follow a fixed opening pattern, so we fall back to
 * it whenever the parser reports plain body text.
 */
const HEADING_PATTERNS: Array<{ level: number; pattern: RegExp }> = [
  { level: 1, pattern: /^bab\s+[ivxlcdm]+\b/i },
  { level: 2, pattern: /^bagian\s+\w+/i },
  { level: 3, pattern: /^paragraf\s+\w+/i },
  { level: 3, pattern: /^pasal\s+\d+/i },
];

const MAX_HEADING_LENGTH = 120;
const MAX_LEVEL = 3;

/** Strong signal: the text itself declares its rank. */
function levelFromPattern(text: string) {
  if (text.length > MAX_HEADING_LENGTH) return 0;
  return HEADING_PATTERNS.find((entry) => entry.pattern.test(text))?.level ?? 0;
}

/** Weak signal: short all-caps lines act as titles in most SK and nota dinas. */
function levelFromCasing(text: string) {
  const hasLetters = /[a-z]/i.test(text);
  const isShout = hasLetters && text === text.toUpperCase() && text.length <= 60;
  return isShout ? 2 : 0;
}

function resolveLevel(section: DocumentSection, text: string) {
  const level =
    levelFromPattern(text) || section.headingLevel || levelFromCasing(text);
  return Math.min(level, MAX_LEVEL);
}

export function buildStructureNodes(
  sections: DocumentSection[],
): StructureNode[] {
  return sections
    .map((section) => ({ section, text: section.content.trim() }))
    .filter(({ text }) => text.length > 0)
    .map(({ section, text }) => ({
      id: section.id,
      level: resolveLevel(section, text),
      text,
      pageNumber: section.pageNumber,
      blockType: section.blockType,
    }));
}

export function hasHeadings(nodes: StructureNode[]) {
  return nodes.some((node) => node.level > 0);
}

export function countPages(nodes: StructureNode[]) {
  const pages = new Set(nodes.map((node) => node.pageNumber).filter((page) => page > 0));
  return pages.size;
}
