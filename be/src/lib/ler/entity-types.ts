export type LerEntityType =
  | "PARTY"
  | "ORG"
  | "DATE"
  | "CONTRACT_NO"
  | "LOCATION";

export type MappedEntity = {
  entityType: LerEntityType;
  entityValue: string;
  confidence: number;
  sourceText?: string;
};

const ALLOWED_TYPES = new Set<LerEntityType>([
  "PARTY",
  "ORG",
  "DATE",
  "CONTRACT_NO",
  "LOCATION",
]);

export function isLerEntityType(value: string): value is LerEntityType {
  return ALLOWED_TYPES.has(value as LerEntityType);
}
