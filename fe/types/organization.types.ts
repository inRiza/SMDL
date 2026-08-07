export type OrganizationType = "unit_kerja" | "divisi" | "vendor" | "mitra";
export type OrganizationSort = "newest" | "oldest" | "name_asc" | "name_desc";
export type DocumentVisibility = "public" | "organization";

export type OrganizationMemberPreview = {
  id: string;
  name: string;
  imageUrl?: string | null;
};

export type OrganizationMember = {
  id: string;
  userId: string | null;
  name: string;
  email: string;
  accessLevel: OrganizationAccessLevel;
};

export type OrganizationListItem = {
  id: string;
  name: string;
  description: string | null;
  type: OrganizationType;
  ownerId: string;
  documentCount: number;
  membersPreview: OrganizationMemberPreview[];
  memberCount: number;
  createdAt: string;
  updatedAt: string;
};

export type OrganizationDocumentItem = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  fileFormat: "pdf" | "docx";
  fileSizeBytes: string;
  status: "processing" | "ready" | "ler_failed";
  visibility: DocumentVisibility;
  createdAt: string;
};

export type OrganizationActivityItem = {
  id: string;
  actorId: string | null;
  actorName: string;
  action: string;
  summary: string;
  metadata: unknown;
  createdAt: string;
};

export type OrganizationDetail = OrganizationListItem & {
  ownerEmail: string;
  members: OrganizationMember[];
  isOwner: boolean;
  myMemberId: string | null;
  myAccessLevel: OrganizationAccessLevel | null;
  canManageMembers: boolean;
  canUploadDocuments: boolean;
  documents: OrganizationDocumentItem[];
  activities: OrganizationActivityItem[];
};

export type OrganizationListResponse = {
  data: OrganizationListItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type OrganizationFilters = {
  q?: string;
  type?: OrganizationType;
  sort?: OrganizationSort;
  page?: number;
  limit?: number;
  mine?: boolean;
};

export type CreateOrganizationInput = {
  name: string;
  description?: string;
  type?: OrganizationType;
};

export type OrganizationAccessLevel = "owner" | "member" | "viewer";

export type OrganizationInviteInput = {
  userId: string;
  name: string;
  email: string;
  accessLevel?: OrganizationAccessLevel;
};

export type OrganizationInviteResult = {
  id: string;
  email: string;
  accessLevel: OrganizationAccessLevel;
  status: "pending" | "accepted" | "declined";
};

export const ORGANIZATION_TYPE_LABELS: Record<OrganizationType, string> = {
  unit_kerja: "Unit Kerja",
  divisi: "Divisi",
  vendor: "Vendor",
  mitra: "Mitra",
};

export const ORGANIZATION_ACCESS_LABELS: Record<OrganizationAccessLevel, string> = {
  owner: "Owner",
  member: "Anggota",
  viewer: "Viewer",
};
