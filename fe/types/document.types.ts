export type DocumentStatus = "processing" | "ready" | "ler_failed";
export type LerUiStatus = "idle" | "pending" | "completed" | "failed";
export type FileFormat = "pdf" | "docx";
export type DocumentSort = "newest" | "oldest" | "title_asc" | "title_desc";

export type LerEntityType = "PARTY" | "DATE" | "CONTRACT_NO" | "ORG" | "LOCATION";

export type LerEntity = {
  id: string;
  entityType: LerEntityType;
  entityValue: string;
  confidence: number;
};

export type DocumentVisibility = "public" | "organization";

export type DocumentListItem = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  documentType: string | null;
  contentArea: string | null;
  classification: string | null;
  publishedAt: string | null;
  revision: string | null;
  legalStatus: string | null;
  source: string | null;
  fileFormat: FileFormat;
  fileSizeBytes: string;
  status: DocumentStatus;
  visibility: DocumentVisibility;
  organizationId: string | null;
  organizationName: string | null;
  ownerName: string;
  createdAt: string;
  updatedAt: string;
};

export type DocumentBlockType =
  | "title"
  | "section"
  | "paragraph"
  | "table"
  | "list"
  | "header"
  | "footer"
  | "other";

export type DocumentSection = {
  id: string;
  orderIndex: number;
  blockType: DocumentBlockType;
  /** 0 = body text, 1..n = heading depth */
  headingLevel: number;
  pageNumber: number;
  content: string;
};

export type DocumentDetail = DocumentListItem & {
  storageKey: string;
  ownerId: string;
  lerStatus: LerUiStatus;
  lerEntities: LerEntity[];
  lerExtractedAt: string | null;
  sections: DocumentSection[];
};

export type LerProgress = {
  documentId: string;
  stage: string;
  progress: number;
  message: string;
  updatedAt: string;
};

export type DocumentLerStatus = {
  documentId: string;
  lerStatus: LerUiStatus;
  progress: LerProgress | null;
  lerEntities: LerEntity[];
  lerExtractedAt: string | null;
  status: DocumentStatus;
};

export type DocumentListResponse = {
  data: DocumentListItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type DocumentFilters = {
  q?: string;
  classification?: string;
  documentType?: string;
  contentArea?: string;
  category?: string;
  status?: DocumentStatus;
  fileFormat?: FileFormat;
  sort?: DocumentSort;
  page?: number;
  limit?: number;
};

export type DocumentActivityItem = {
  id: string;
  documentId: string | null;
  actorId: string | null;
  actorName: string;
  action: string;
  summary: string;
  metadata: unknown;
  createdAt: string;
};

export type WorkspaceDocumentItem = DocumentListItem & {
  canManage: boolean;
  lerStatus: LerUiStatus;
  lerExtractedAt: string | null;
};

export type DocumentWorkspace = {
  user: {
    id: string;
    name: string;
    email: string;
    role: "admin" | "owner" | "viewer" | "auditor";
  };
  canUpload: boolean;
  documentCount: number;
  documents: WorkspaceDocumentItem[];
  activities: DocumentActivityItem[];
};
