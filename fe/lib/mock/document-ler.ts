import type { DocumentDetail, DocumentListItem, LerEntity } from "@/types/document.types";

const MOCK_OWNER = "00000000-0000-0000-0000-000000000001";
const MOCK_ORG = "00000000-0000-0000-0000-000000000002";

function buildEntities(document: DocumentListItem): LerEntity[] {
  if (document.status === "processing") return [];
  if (document.status === "ler_failed") return [];

  const base: LerEntity[] = [
    {
      id: "1",
      entityType: "PARTY",
      entityValue: "PT. Telekomunikasi Indonesia Tbk",
      confidence: 0.97,
    },
    {
      id: "2",
      entityType: "ORG",
      entityValue: "Divisi Legal & Compliance",
      confidence: 0.91,
    },
    {
      id: "3",
      entityType: "CONTRACT_NO",
      entityValue: "TLK-LEGAL-2025-0042",
      confidence: 0.88,
    },
    {
      id: "4",
      entityType: "DATE",
      entityValue: "15 Januari 2025",
      confidence: 0.94,
    },
    {
      id: "5",
      entityType: "LOCATION",
      entityValue: "Jakarta, Indonesia",
      confidence: 0.86,
    },
  ];

  if (document.title.toLowerCase().includes("vendor")) {
    base.unshift({
      id: "6",
      entityType: "PARTY",
      entityValue: "PT. Vendor A Indonesia",
      confidence: 0.93,
    });
  }

  if (document.category === "NDA") {
    return base.filter((e) =>
      ["PARTY", "DATE", "LOCATION", "ORG"].includes(e.entityType)
    );
  }

  return base;
}

export function toDocumentDetail(
  document: DocumentListItem & {
    storageKey?: string;
    ownerId?: string;
  }
): DocumentDetail {
  const lerStatus =
    document.status === "processing"
      ? "pending"
      : document.status === "ler_failed"
        ? "failed"
        : "completed";

  return {
    ...document,
    storageKey: document.storageKey ?? `docs/${document.id}.${document.fileFormat}`,
    ownerId: document.ownerId ?? MOCK_OWNER,
    organizationId: document.organizationId ?? null,
    visibility: document.visibility ?? "public",
    lerStatus,
    lerEntities: buildEntities(document),
    lerExtractedAt:
      lerStatus === "completed" ? document.updatedAt : null,
  };
}
