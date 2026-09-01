import type { DocumentDetail, LerEntity, LerEntityType } from "@/types/document.types";
import { buildStructureNodes, type StructureNode } from "./document-structure";
import { AI_SUMMARY_FIELDS } from "./document-metadata";

export type SummaryFieldKey = (typeof AI_SUMMARY_FIELDS)[number]["key"];

export type SummaryField = {
  key: SummaryFieldKey;
  label: string;
  values: string[];
  /** where the value came from, shown so users can judge reliability */
  origin: "entity" | "section";
};

const MAX_VALUES_PER_FIELD = 4;
const MAX_BODY_LENGTH = 320;

/** headings that usually introduce the narrative fields of an Indonesian legal doc */
const SECTION_KEYWORDS: Partial<Record<SummaryFieldKey, RegExp>> = {
  tujuan: /\b(maksud|tujuan|menimbang)\b/i,
  proses: /\b(ruang lingkup|prosedur|tata cara|mekanisme|proses)\b/i,
  tanggungJawab: /\b(tanggung jawab|kewajiban|wewenang|hak dan kewajiban)\b/i,
};

const ENTITY_SOURCES: Partial<Record<SummaryFieldKey, LerEntityType>> = {
  ditetapkanOleh: "ORG",
  ditandatanganiOleh: "PARTY",
  efektifSejak: "DATE",
  hubunganPeraturan: "CONTRACT_NO",
};

function uniqueValues(values: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const normalized = value.trim();
    const key = normalized.toLowerCase();
    if (!normalized || seen.has(key)) continue;
    seen.add(key);
    result.push(normalized);
    if (result.length === MAX_VALUES_PER_FIELD) break;
  }

  return result;
}

function valuesFromEntities(entities: LerEntity[], type: LerEntityType) {
  const matching = entities
    .filter((entity) => entity.entityType === type)
    .sort((a, b) => b.confidence - a.confidence)
    .map((entity) => entity.entityValue);

  return uniqueValues(matching);
}

function truncate(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return [];
  return [
    normalized.length > MAX_BODY_LENGTH
      ? `${normalized.slice(0, MAX_BODY_LENGTH).trimEnd()}…`
      : normalized,
  ];
}

/**
 * Reads the narrative belonging to a heading. Nested headings (e.g. "Pasal 3"
 * under "BAB II MAKSUD DAN TUJUAN") are skipped but their body is kept, so the
 * section ends only at the next heading of equal or higher rank.
 */
function bodyAfterHeading(nodes: StructureNode[], pattern: RegExp) {
  const headingIndex = nodes.findIndex(
    (node) => node.level > 0 && pattern.test(node.text),
  );

  if (headingIndex === -1) {
    // flat documents keep these phrases inside a normal paragraph
    const inline = nodes.find((node) => node.level === 0 && pattern.test(node.text));
    return inline ? truncate(inline.text) : [];
  }

  const headingLevel = nodes[headingIndex].level;
  const body: string[] = [];

  for (const node of nodes.slice(headingIndex + 1)) {
    if (node.level > 0 && node.level <= headingLevel) break;
    if (node.level === 0) body.push(node.text);
  }

  return truncate(body.join(" "));
}

export function buildDocumentSummary(document: DocumentDetail): SummaryField[] {
  const nodes = buildStructureNodes(document.sections);

  return AI_SUMMARY_FIELDS.map((field) => {
    const entityType = ENTITY_SOURCES[field.key];
    if (entityType) {
      return {
        key: field.key,
        label: field.label,
        values: valuesFromEntities(document.lerEntities, entityType),
        origin: "entity" as const,
      };
    }

    const keyword = SECTION_KEYWORDS[field.key];
    return {
      key: field.key,
      label: field.label,
      values: keyword ? bodyAfterHeading(nodes, keyword) : [],
      origin: "section" as const,
    };
  });
}

export function countFilledFields(fields: SummaryField[]) {
  return fields.filter((field) => field.values.length > 0).length;
}
