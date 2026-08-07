import type { OrganizationType } from "@prisma/client";

export type OrganizationAccessLevel = "owner" | "member" | "viewer";

export type OrganizationMemberPreview = {
  id: string;
  name: string;
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
  memberCount: number;
  membersPreview: OrganizationMemberPreview[];
  createdAt: string;
  updatedAt: string;
};

export type OrganizationDetail = OrganizationListItem & {
  ownerEmail: string;
  members: OrganizationMember[];
  isOwner: boolean;
  myMemberId: string | null;
  myAccessLevel: OrganizationAccessLevel | null;
  canManageMembers: boolean;
  canUploadDocuments: boolean;
  documents: Array<{
    id: string;
    title: string;
    description: string | null;
    category: string | null;
    fileFormat: "pdf" | "docx";
    fileSizeBytes: string;
    status: "processing" | "ready" | "ler_failed";
    createdAt: string;
  }>;
  activities: OrganizationActivityItem[];
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

export type OrganizationListResponse = {
  data: OrganizationListItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
