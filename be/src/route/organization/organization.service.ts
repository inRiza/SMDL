import type {
  OrganizationAccessLevel,
  OrganizationActivityItem,
  OrganizationDetail,
  OrganizationListResponse,
  OrganizationMember,
  OrganizationMemberPreview,
} from "@/types/organization.types";
import { getMemberDisplayName } from "@/lib/organization/member-display";
import type {
  CreateOrganizationDocumentWithFile,
  CreateOrganizationInput,
  InviteOrganizationMembersInput,
  OrganizationListQueryInput,
  UpdateMemberAccessInput,
  UpdateOrganizationDocumentInput,
  UpdateOrganizationInput,
  TransferOwnershipInput,
} from "@/validators/organization.validator";
import { OrganizationRepository } from "./organization.repository";

const accessOrder: Record<OrganizationAccessLevel, number> = {
  owner: 0,
  member: 1,
  viewer: 2,
};

function mapMemberPreview(member: {
  id: string;
  email: string;
  user?: { name: string } | null;
}): OrganizationMemberPreview {
  return {
    id: member.id,
    name: getMemberDisplayName(member),
  };
}

function mapMember(member: {
  id: string;
  userId: string | null;
  email: string;
  accessLevel: OrganizationAccessLevel;
  user?: { name: string } | null;
}): OrganizationMember {
  return {
    id: member.id,
    userId: member.userId,
    name: getMemberDisplayName(member),
    email: member.email,
    accessLevel: member.accessLevel,
  };
}

function sortMembers<T extends { accessLevel: OrganizationAccessLevel; name: string }>(
  members: T[]
) {
  return [...members].sort((a, b) => {
    const levelDiff = accessOrder[a.accessLevel] - accessOrder[b.accessLevel];
    if (levelDiff !== 0) return levelDiff;
    return a.name.localeCompare(b.name, "id");
  });
}

function mapDocument(doc: {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  fileFormat: "pdf" | "docx";
  fileSizeBytes: bigint;
  status: "processing" | "ready" | "ler_failed";
  visibility: "public" | "organization";
  createdAt: Date;
}) {
  return {
    id: doc.id,
    title: doc.title,
    description: doc.description,
    category: doc.category,
    fileFormat: doc.fileFormat,
    fileSizeBytes: doc.fileSizeBytes.toString(),
    status: doc.status,
    visibility: doc.visibility,
    createdAt: doc.createdAt.toISOString(),
  };
}

function mapActivity(activity: {
  id: string;
  actorId: string | null;
  actorName: string;
  action: string;
  summary: string;
  metadata: unknown;
  createdAt: Date;
}): OrganizationActivityItem {
  return {
    id: activity.id,
    actorId: activity.actorId,
    actorName: activity.actorName,
    action: activity.action,
    summary: activity.summary,
    metadata: activity.metadata,
    createdAt: activity.createdAt.toISOString(),
  };
}

export class OrganizationService {
  constructor(
    private readonly repository: OrganizationRepository = new OrganizationRepository()
  ) {}

  async listOrganizations(
    query: OrganizationListQueryInput,
    viewerId?: string
  ): Promise<OrganizationListResponse> {
    const { rows, total } = await this.repository.findMany(query, viewerId);

    return {
      data: rows.map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        type: row.type,
        ownerId: row.ownerId,
        documentCount: row._count.documents,
        memberCount: row._count.members,
        membersPreview: row.members.map(mapMemberPreview),
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      })),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async getOrganization(
    id: string,
    viewerId?: string
  ): Promise<OrganizationDetail | null> {
    const row = await this.repository.findById(id);
    if (!row) return null;

    const members = sortMembers(row.members.map(mapMember));
    const myMembership = viewerId
      ? members.find((member) => member.userId === viewerId)
      : undefined;
    const isOwner = viewerId ? row.ownerId === viewerId : false;
    const myAccessLevel = isOwner
      ? ("owner" as const)
      : (myMembership?.accessLevel ?? null);
    const canManageMembers = isOwner || myAccessLevel === "owner";
    const canUploadDocuments =
      isOwner || myAccessLevel === "owner" || myAccessLevel === "member";

    return {
      id: row.id,
      name: row.name,
      description: row.description,
      type: row.type,
      ownerId: row.ownerId,
      ownerEmail: row.owner.email,
      documentCount: row._count.documents,
      memberCount: row._count.members,
      membersPreview: members.slice(0, 3).map((member) => ({
        id: member.id,
        name: member.name,
      })),
      members,
      isOwner,
      myMemberId: myMembership?.id ?? null,
      myAccessLevel,
      canManageMembers,
      canUploadDocuments,
      documents: row.documents.map(mapDocument),
      activities: row.activities.map(mapActivity),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async createOrganization(
    input: CreateOrganizationInput,
    ownerId: string,
    ownerEmail: string
  ) {
    const row = await this.repository.create(input, ownerId, ownerEmail);

    return {
      id: row.id,
      name: row.name,
      description: row.description,
      type: row.type,
      ownerId: row.ownerId,
      documentCount: row._count.documents,
      memberCount: 1,
      membersPreview: [],
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async updateOrganization(
    organizationId: string,
    ownerId: string,
    actorName: string,
    input: UpdateOrganizationInput
  ) {
    return this.repository.updateOrganization(
      organizationId,
      ownerId,
      input,
      actorName
    );
  }

  async inviteMembers(
    organizationId: string,
    ownerId: string,
    actorName: string,
    input: InviteOrganizationMembersInput
  ) {
    const organization = await this.repository.findOwnedOrganization(
      organizationId,
      ownerId
    );

    if (!organization) {
      return null;
    }

    const invites = await this.repository.createInvites(
      organizationId,
      ownerId,
      actorName,
      input.invites
    );

    return { data: invites };
  }

  async updateMemberAccess(
    organizationId: string,
    memberId: string,
    ownerId: string,
    actorName: string,
    input: UpdateMemberAccessInput
  ) {
    return this.repository.updateMemberAccess(
      organizationId,
      memberId,
      ownerId,
      actorName,
      input
    );
  }

  async removeMember(
    organizationId: string,
    memberId: string,
    ownerId: string,
    actorName: string
  ) {
    return this.repository.removeMember(
      organizationId,
      memberId,
      ownerId,
      actorName
    );
  }

  async createDocument(
    organizationId: string,
    ownerId: string,
    actorName: string,
    input: CreateOrganizationDocumentWithFile
  ) {
    const document = await this.repository.createDocument(
      organizationId,
      ownerId,
      actorName,
      input
    );
    if (!document) return null;
    return mapDocument(document);
  }

  async updateDocument(
    organizationId: string,
    documentId: string,
    ownerId: string,
    actorName: string,
    input: UpdateOrganizationDocumentInput
  ) {
    const result = await this.repository.updateDocument(
      organizationId,
      documentId,
      ownerId,
      actorName,
      input
    );
    if (result === "forbidden" || result === "not_found") return result;
    return mapDocument(result);
  }

  async transferOwnership(
    organizationId: string,
    ownerId: string,
    actorName: string,
    input: TransferOwnershipInput
  ) {
    return this.repository.transferOwnership(
      organizationId,
      ownerId,
      actorName,
      input
    );
  }

  async leaveOrganization(
    organizationId: string,
    userId: string,
    actorName: string
  ) {
    return this.repository.leaveOrganization(organizationId, userId, actorName);
  }

  async revokeDocument(
    organizationId: string,
    documentId: string,
    ownerId: string,
    actorName: string
  ) {
    return this.repository.revokeDocument(
      organizationId,
      documentId,
      ownerId,
      actorName
    );
  }
}
