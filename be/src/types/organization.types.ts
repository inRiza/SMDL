import type { OrganizationType } from "@prisma/client";

export type OrganizationListItem = {
  id: string;
  name: string;
  description: string | null;
  type: OrganizationType;
  ownerId: string;
  documentCount: number;
  createdAt: string;
  updatedAt: string;
};

export type OrganizationDetail = OrganizationListItem & {
  ownerEmail: string;
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
