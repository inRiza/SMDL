export type OrganizationType = "unit_kerja" | "divisi" | "vendor" | "mitra";
export type OrganizationSort = "newest" | "oldest" | "name_asc" | "name_desc";

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

export type OrganizationFilters = {
  q?: string;
  type?: OrganizationType;
  sort?: OrganizationSort;
  page?: number;
  limit?: number;
};

export type CreateOrganizationInput = {
  name: string;
  description?: string;
  type?: OrganizationType;
};

export type OrganizationAccessLevel = "owner" | "member" | "viewer";

export type OrganizationInviteInput = {
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
