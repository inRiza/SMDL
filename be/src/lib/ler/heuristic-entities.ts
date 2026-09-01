import type { LerEntityType, MappedEntity } from "./entity-types";

const MONTHS =
  "Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember";

/** common SMDL / Telkom document number shapes */
const DOC_NO_PATTERN =
  /\b(?:Nomor|No\.?|NOMOR)\s*:?\s*([A-Z0-9][A-Z0-9/\-]{4,})\b/gi;

const INLINE_DOC_NO_PATTERN =
  /\b([A-Z]{2,}(?:\/[A-Z0-9]+){2,})\b/g;

const DATE_PATTERN = new RegExp(
  `\\b(\\d{1,2}\\s+(?:${MONTHS})\\s+\\d{4})\\b`,
  "gi"
);

const ORG_PATTERN =
  /\b(PT\s+[A-Za-z0-9][A-Za-z0-9\s\(\)\.&,-]*?(?:\s+Tbk|\s+TBK)?)(?=\s*(?:NOMOR|Nomor|No\.|$|\n))/gi;

const DIVISI_PATTERN =
  /\b(Divisi\s+[A-Za-z][A-Za-z\s&]{2,40})\b/gi;

const LOCATION_PATTERN =
  /\b(?:di|bertempat di)\s+([A-Z][A-Za-z\s]{2,30}?)(?=\s+pada|\s+tanggal|,|\.|$)/gi;

const KNOWN_LOCATIONS = [
  "Jakarta Selatan",
  "Jakarta Pusat",
  "Jakarta",
  "Bandung",
  "Surabaya",
];

function normalizeKey(type: string, value: string) {
  return `${type}:${value.toLowerCase().replace(/\s+/g, " ").trim()}`;
}

function addMatch(
  bucket: Map<string, MappedEntity>,
  type: LerEntityType,
  value: string,
  confidence: number
) {
  const trimmed = value.replace(/\s+/g, " ").trim();
  if (!trimmed || trimmed.length < 3) return;

  const key = normalizeKey(type, trimmed);
  const existing = bucket.get(key);
  if (existing && existing.confidence >= confidence) return;

  bucket.set(key, {
    entityType: type,
    entityValue: trimmed,
    confidence,
    sourceText: trimmed,
  });
}

function extractDocNumbers(text: string, bucket: Map<string, MappedEntity>) {
  for (const match of text.matchAll(DOC_NO_PATTERN)) {
    addMatch(bucket, "CONTRACT_NO", match[1], 0.92);
  }

  for (const match of text.matchAll(INLINE_DOC_NO_PATTERN)) {
    const value = match[1];
    if (/^\d{4}$/.test(value)) continue;
    if (!value.includes("/")) continue;
    addMatch(bucket, "CONTRACT_NO", value, 0.78);
  }
}

function extractDates(text: string, bucket: Map<string, MappedEntity>) {
  for (const match of text.matchAll(DATE_PATTERN)) {
    addMatch(bucket, "DATE", match[1], 0.88);
  }
}

function extractOrgs(text: string, bucket: Map<string, MappedEntity>) {
  for (const match of text.matchAll(ORG_PATTERN)) {
    addMatch(bucket, "ORG", match[1], 0.82);
  }

  for (const match of text.matchAll(DIVISI_PATTERN)) {
    addMatch(bucket, "ORG", match[1], 0.75);
  }
}

function extractLocations(text: string, bucket: Map<string, MappedEntity>) {
  for (const location of KNOWN_LOCATIONS) {
    if (text.includes(location)) {
      addMatch(bucket, "LOCATION", location, 0.85);
    }
  }

  for (const match of text.matchAll(LOCATION_PATTERN)) {
    addMatch(bucket, "LOCATION", match[1], 0.7);
  }
}

/** rule-based fallback when IndoBERT NER misses legal-doc fields */
export function extractHeuristicEntities(fullText: string): MappedEntity[] {
  const bucket = new Map<string, MappedEntity>();
  const text = fullText.replace(/\s+/g, " ");

  extractDocNumbers(text, bucket);
  extractDates(text, bucket);
  extractOrgs(text, bucket);
  extractLocations(text, bucket);

  return [...bucket.values()].sort((a, b) => b.confidence - a.confidence);
}

export function mergeEntities(
  nerEntities: MappedEntity[],
  heuristicEntities: MappedEntity[]
): MappedEntity[] {
  const bucket = new Map<string, MappedEntity>();

  for (const entity of [...nerEntities, ...heuristicEntities]) {
    const key = normalizeKey(entity.entityType, entity.entityValue);
    const existing = bucket.get(key);
    if (!existing || entity.confidence > existing.confidence) {
      bucket.set(key, entity);
    }
  }

  return [...bucket.values()].sort((a, b) => b.confidence - a.confidence);
}
