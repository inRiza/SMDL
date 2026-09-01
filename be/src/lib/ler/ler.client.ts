import { isLerEntityType, type LerEntityType, type MappedEntity } from "./entity-types";

type LerServiceEntity = {
  type: string;
  value: string;
  start: number;
  end: number;
  confidence: number;
  source_text: string;
};

type LerServiceBlock = {
  text: string;
  block_type: string;
  level: number;
  page: number;
  char_start: number;
  char_end: number;
};

type LerExtractResponse = {
  entities: LerServiceEntity[];
  blocks?: LerServiceBlock[];
  model_version: string;
  model_variant: string;
  entity_count: number;
  full_text: string;
  block_count: number;
  parser: string;
};

export type DocumentBlock = {
  text: string;
  blockType: string;
  level: number;
  page: number;
};

function mapBlocks(items: LerServiceBlock[] | undefined): DocumentBlock[] {
  if (!items) return [];
  return items
    .filter((item) => item.text.trim())
    .map((item) => ({
      text: item.text.trim(),
      blockType: item.block_type,
      level: item.level,
      page: item.page,
    }));
}

import { env } from "@/lib/config/env.config";

const LER_SERVICE_URL = env.LER_SERVICE_URL;
const LER_TIMEOUT_MS = env.LER_TIMEOUT_MS;
const LER_MODEL_VARIANT = env.LER_MODEL_VARIANT;

function mapEntities(items: LerServiceEntity[]): MappedEntity[] {
  return items
    .filter((item) => isLerEntityType(item.type) && item.value.trim())
    .map((item) => ({
      entityType: item.type as LerEntityType,
      entityValue: item.value.trim(),
      confidence: item.confidence,
      sourceText: item.source_text,
    }));
}

export async function extractViaLerService(
  fileBuffer: Buffer,
  filename: string,
  documentId?: string,
): Promise<{
  entities: MappedEntity[];
  blocks: DocumentBlock[];
  fullText: string;
  modelVersion: string;
  modelVariant: string;
  blockCount: number;
}> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LER_TIMEOUT_MS);

  try {
    const form = new FormData();
    form.append(
      "file",
      new File([fileBuffer], filename || "document.pdf"),
    );
    if (documentId) form.append("document_id", documentId);
    form.append("model_variant", LER_MODEL_VARIANT);

    const response = await fetch(`${LER_SERVICE_URL}/extract/document`, {
      method: "POST",
      body: form,
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `LER service error (${response.status}): ${body || response.statusText}`,
      );
    }

    const payload = (await response.json()) as LerExtractResponse;

    return {
      entities: mapEntities(payload.entities),
      blocks: mapBlocks(payload.blocks),
      fullText: payload.full_text,
      modelVersion: payload.model_version,
      modelVariant: payload.model_variant,
      blockCount: payload.block_count,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("LER service timeout");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function checkLerServiceHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${LER_SERVICE_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}
