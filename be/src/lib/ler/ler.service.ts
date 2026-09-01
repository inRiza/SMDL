import { extractViaLerService, type DocumentBlock } from "./ler.client";
import type { MappedEntity } from "./entity-types";
import { extractHeuristicEntities, mergeEntities } from "./heuristic-entities";

export type LerExtractionResult = {
  entities: MappedEntity[];
  blocks: DocumentBlock[];
  fullText: string;
  modelVersion: string;
  modelVariant: string;
};

export async function extractLegalEntities(
  fileBuffer: Buffer,
  filename: string,
  documentId?: string,
): Promise<LerExtractionResult> {
  const result = await extractViaLerService(fileBuffer, filename, documentId);
  const heuristic = extractHeuristicEntities(result.fullText);

  return {
    entities: mergeEntities(result.entities, heuristic),
    blocks: result.blocks,
    fullText: result.fullText,
    modelVersion: result.modelVersion,
    modelVariant: result.modelVariant,
  };
}
