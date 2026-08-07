export type DocumentStatus = "processing" | "ready" | "ler_failed";
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
  fileFormat: FileFormat;
  fileSizeBytes: string;
  status: DocumentStatus;
  visibility: DocumentVisibility;
  organizationId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DocumentDetail = DocumentListItem & {
  storageKey: string;
  ownerId: string;
  lerStatus: "pending" | "completed" | "failed";
  lerEntities: LerEntity[];
  lerExtractedAt: string | null;
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
  organizationName: string | null;
  canManage: boolean;
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
