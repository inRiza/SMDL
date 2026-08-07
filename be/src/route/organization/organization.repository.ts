import type { Prisma } from "@prisma/client";
import { prismaClient } from "@/lib/db/prisma";
import { recordDocumentActivity } from "@/lib/document/document-activity-log";
import { getMemberDisplayName } from "@/lib/organization/member-display";
import type {
  CreateOrganizationDocumentInput,
  CreateOrganizationInput,
  InviteOrganizationMembersInput,
  OrganizationListQueryInput,
  UpdateMemberAccessInput,
  UpdateOrganizationDocumentInput,
  UpdateOrganizationInput,
} from "@/validators/organization.validator";

const memberPreviewSelect = {
  id: true,
  email: true,
  userId: true,
  user: {
    select: { name: true },
  },
} satisfies Prisma.OrganizationMemberSelect;

const memberDetailSelect = {
  id: true,
  userId: true,
  email: true,
  accessLevel: true,
  status: true,
  user: {
    select: { name: true },
  },
} satisfies Prisma.OrganizationMemberSelect;

function buildWhere(
  query: OrganizationListQueryInput,
  ownerId?: string
): Prisma.OrganizationWhereInput {
  const where: Prisma.OrganizationWhereInput = {};

  if (query.mine && ownerId) {
    where.ownerId = ownerId;
  }

  if (query.q) {
    where.OR = [
      { name: { contains: query.q, mode: "insensitive" } },
      { description: { contains: query.q, mode: "insensitive" } },
    ];
  }

  if (query.type) {
    where.type = query.type;
  }

  return where;
}

function buildOrderBy(
  sort: OrganizationListQueryInput["sort"]
): Prisma.OrganizationOrderByWithRelationInput {
  switch (sort) {
    case "oldest":
      return { createdAt: "asc" };
    case "name_asc":
      return { name: "asc" };
    case "name_desc":
      return { name: "desc" };
    default:
      return { createdAt: "desc" };
  }
}

export class OrganizationRepository {
  async findMany(query: OrganizationListQueryInput, ownerId?: string) {
    const where = buildWhere(query, ownerId);
    const orderBy = buildOrderBy(query.sort);
    const skip = (query.page - 1) * query.limit;

    const [rows, total] = await Promise.all([
      prismaClient.organization.findMany({
        where,
        orderBy,
        skip,
        take: query.limit,
        select: {
          id: true,
          name: true,
          description: true,
          type: true,
          ownerId: true,
          createdAt: true,
          updatedAt: true,
          members: {
            where: { status: "accepted" },
            orderBy: { createdAt: "asc" },
            take: 3,
            select: memberPreviewSelect,
          },
          _count: {
            select: {
              documents: true,
              members: { where: { status: "accepted" } },
            },
          },
        },
      }),
      prismaClient.organization.count({ where }),
    ]);

    return { rows, total };
  }

  async findById(id: string) {
    return prismaClient.organization.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        ownerId: true,
        createdAt: true,
        updatedAt: true,
        owner: {
          select: { email: true, name: true },
        },
        members: {
          where: { status: "accepted" },
          orderBy: { createdAt: "asc" },
          select: memberDetailSelect,
        },
        documents: {
          orderBy: { createdAt: "desc" },
          take: 50,
          select: {
            id: true,
            title: true,
            description: true,
            category: true,
            fileFormat: true,
            fileSizeBytes: true,
            status: true,
            createdAt: true,
          },
        },
        activities: {
          orderBy: { createdAt: "desc" },
          take: 40,
          select: {
            id: true,
            actorId: true,
            actorName: true,
            action: true,
            summary: true,
            metadata: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            documents: true,
            members: { where: { status: "accepted" } },
          },
        },
      },
    });
  }

  async create(input: CreateOrganizationInput, ownerId: string, ownerEmail: string) {
    return prismaClient.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: input.name,
          description: input.description,
          type: input.type,
          ownerId,
        },
        select: {
          id: true,
          name: true,
          description: true,
          type: true,
          ownerId: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { documents: true },
          },
        },
      });

      await tx.organizationMember.create({
        data: {
          organizationId: organization.id,
          userId: ownerId,
          email: ownerEmail.toLowerCase(),
          accessLevel: "owner",
          status: "accepted",
          invitedById: ownerId,
        },
      });

      await tx.organizationActivity.create({
        data: {
          organizationId: organization.id,
          actorId: ownerId,
          actorName: ownerEmail,
          action: "organization.created",
          summary: `membuat organisasi “${organization.name}”`,
        },
      });

      return organization;
    });
  }

  async findOwnedOrganization(organizationId: string, ownerId: string) {
    return prismaClient.organization.findFirst({
      where: { id: organizationId, ownerId },
      select: { id: true, ownerId: true, name: true },
    });
  }

  async updateOrganization(
    organizationId: string,
    ownerId: string,
    input: UpdateOrganizationInput,
    actorName: string
  ) {
    const organization = await this.findOwnedOrganization(organizationId, ownerId);
    if (!organization) return null;

    const updated = await prismaClient.organization.update({
      where: { id: organizationId },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.type !== undefined ? { type: input.type } : {}),
      },
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        ownerId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const changes: string[] = [];
    if (input.name && input.name !== organization.name) {
      changes.push(`nama menjadi “${input.name}”`);
    }
    if (input.description !== undefined) changes.push("deskripsi diperbarui");
    if (input.type) changes.push(`tipe menjadi ${input.type}`);

    await this.createActivity({
      organizationId,
      actorId: ownerId,
      actorName,
      action: "organization.updated",
      summary: changes.length
        ? `memperbarui organisasi: ${changes.join(", ")}`
        : "memperbarui organisasi",
      metadata: input,
    });

    return updated;
  }

  async createInvites(
    organizationId: string,
    invitedById: string,
    actorName: string,
    invites: InviteOrganizationMembersInput["invites"]
  ) {
    for (const invite of invites) {
      const email = invite.email.toLowerCase();
      await prismaClient.organizationMember.upsert({
        where: {
          organizationId_email: { organizationId, email },
        },
        update: {
          userId: invite.userId ?? undefined,
          accessLevel: invite.accessLevel ?? "member",
          status: invite.userId ? "accepted" : "pending",
        },
        create: {
          organizationId,
          email,
          userId: invite.userId,
          accessLevel: invite.accessLevel ?? "member",
          status: invite.userId ? "accepted" : "pending",
          invitedById,
        },
      });

      await this.createActivity({
        organizationId,
        actorId: invitedById,
        actorName,
        action: "member.invited",
        summary: `menambahkan anggota ${invite.name ?? email} sebagai ${invite.accessLevel ?? "member"}`,
        metadata: { email, accessLevel: invite.accessLevel ?? "member" },
      });
    }

    return prismaClient.organizationMember.findMany({
      where: {
        organizationId,
        email: { in: invites.map((item) => item.email.toLowerCase()) },
      },
      select: {
        id: true,
        email: true,
        accessLevel: true,
        status: true,
      },
    });
  }

  async updateMemberAccess(
    organizationId: string,
    memberId: string,
    ownerId: string,
    actorName: string,
    input: UpdateMemberAccessInput
  ) {
    const organization = await this.findOwnedOrganization(organizationId, ownerId);
    if (!organization) return "forbidden" as const;

    const member = await prismaClient.organizationMember.findFirst({
      where: {
        id: memberId,
        organizationId,
        accessLevel: { not: "owner" },
      },
      select: { id: true, email: true, accessLevel: true },
    });

    if (!member) return "not_found" as const;

    const previous = member.accessLevel;
    await prismaClient.organizationMember.update({
      where: { id: memberId },
      data: { accessLevel: input.accessLevel },
    });

    await this.createActivity({
      organizationId,
      actorId: ownerId,
      actorName,
      action: "member.access_changed",
      summary: `mengubah akses ${member.email} dari ${previous} menjadi ${input.accessLevel}`,
      metadata: { memberId, from: previous, to: input.accessLevel },
    });

    return "ok" as const;
  }

  async removeMember(
    organizationId: string,
    memberId: string,
    ownerId: string,
    actorName: string
  ) {
    const organization = await this.findOwnedOrganization(organizationId, ownerId);
    if (!organization) return "forbidden" as const;

    const member = await prismaClient.organizationMember.findFirst({
      where: {
        id: memberId,
        organizationId,
        accessLevel: { not: "owner" },
      },
      select: { id: true, email: true },
    });

    if (!member) return "not_found" as const;

    await prismaClient.organizationMember.delete({
      where: { id: memberId },
    });

    await this.createActivity({
      organizationId,
      actorId: ownerId,
      actorName,
      action: "member.removed",
      summary: `menghapus anggota ${member.email}`,
      metadata: { memberId, email: member.email },
    });

    return "ok" as const;
  }

  async createDocument(
    organizationId: string,
    ownerId: string,
    actorName: string,
    input: CreateOrganizationDocumentInput
  ) {
    const organization = await this.findOwnedOrganization(organizationId, ownerId);
    if (!organization) return null;

    const document = await prismaClient.document.create({
      data: {
        title: input.title,
        description: input.description,
        category: input.category,
        fileFormat: input.fileFormat,
        fileSizeBytes: BigInt(input.fileSizeBytes ?? 1024),
        status: "processing",
        visibility: input.visibility,
        storageKey: `org/${organizationId}/${crypto.randomUUID()}`,
        ownerId,
        organizationId,
      },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        fileFormat: true,
        fileSizeBytes: true,
        status: true,
        visibility: true,
        createdAt: true,
      },
    });

    await this.createActivity({
      organizationId,
      actorId: ownerId,
      actorName,
      action: "document.uploaded",
      summary: `mengunggah dokumen “${document.title}” (${document.fileFormat.toUpperCase()}, ${input.visibility === "public" ? "publik" : "khusus organisasi"})`,
      metadata: { documentId: document.id, title: document.title, visibility: input.visibility },
    });

    await recordDocumentActivity({
      documentId: document.id,
      actorId: ownerId,
      actorName,
      action: "document.uploaded",
      summary: `mengunggah dokumen “${document.title}” (${document.fileFormat.toUpperCase()}, ${input.visibility === "public" ? "publik" : "khusus organisasi"})`,
      metadata: { documentId: document.id, title: document.title, visibility: input.visibility },
    });

    // simulate async LER kickoff — status stays processing
    return document;
  }

  async updateDocument(
    organizationId: string,
    documentId: string,
    ownerId: string,
    actorName: string,
    input: UpdateOrganizationDocumentInput
  ) {
    const organization = await this.findOwnedOrganization(organizationId, ownerId);
    if (!organization) return "forbidden" as const;

    const existing = await prismaClient.document.findFirst({
      where: { id: documentId, organizationId },
      select: { id: true, title: true },
    });
    if (!existing) return "not_found" as const;

    const updated = await prismaClient.document.update({
      where: { id: documentId },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.category !== undefined ? { category: input.category } : {}),
      },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        fileFormat: true,
        fileSizeBytes: true,
        status: true,
        visibility: true,
        createdAt: true,
      },
    });

    const summary =
      input.title && input.title !== existing.title
        ? `mengganti nama dokumen “${existing.title}” → “${input.title}”`
        : `memperbarui dokumen “${existing.title}”`;

    await this.createActivity({
      organizationId,
      actorId: ownerId,
      actorName,
      action: "document.updated",
      summary,
      metadata: { documentId, ...input },
    });

    await recordDocumentActivity({
      documentId,
      actorId: ownerId,
      actorName,
      action: "document.updated",
      summary,
      metadata: { documentId, ...input },
    });

    return updated;
  }

  async revokeDocument(
    organizationId: string,
    documentId: string,
    ownerId: string,
    actorName: string
  ) {
    const organization = await this.findOwnedOrganization(organizationId, ownerId);
    if (!organization) return "forbidden" as const;

    const existing = await prismaClient.document.findFirst({
      where: { id: documentId, organizationId },
      select: { id: true, title: true },
    });
    if (!existing) return "not_found" as const;

    await this.createActivity({
      organizationId,
      actorId: ownerId,
      actorName,
      action: "document.revoked",
      summary: `mencabut/menghapus dokumen “${existing.title}”`,
      metadata: { documentId, title: existing.title },
    });

    await recordDocumentActivity({
      documentId,
      actorId: ownerId,
      actorName,
      action: "document.revoked",
      summary: `mencabut/menghapus dokumen “${existing.title}”`,
      metadata: { documentId, title: existing.title },
    });

    await prismaClient.document.delete({ where: { id: documentId } });

    return "ok" as const;
  }

  async transferOwnership(
    organizationId: string,
    currentOwnerId: string,
    actorName: string,
    input: { newOwnerMemberId: string; demotedAccessLevel: "member" | "viewer" }
  ) {
    const organization = await this.findOwnedOrganization(organizationId, currentOwnerId);
    if (!organization) return "forbidden" as const;

    const newOwnerMember = await prismaClient.organizationMember.findFirst({
      where: {
        id: input.newOwnerMemberId,
        organizationId,
        accessLevel: { not: "owner" },
        userId: { not: null },
      },
      select: {
        id: true,
        userId: true,
        email: true,
        user: { select: { name: true } },
      },
    });

    if (!newOwnerMember?.userId) return "not_found" as const;

    const currentOwnerMember = await prismaClient.organizationMember.findFirst({
      where: {
        organizationId,
        userId: currentOwnerId,
        accessLevel: "owner",
      },
      select: { id: true, email: true },
    });

    if (!currentOwnerMember) return "not_found" as const;

    const newOwnerName = getMemberDisplayName(newOwnerMember);

    await prismaClient.$transaction(async (tx) => {
      await tx.organization.update({
        where: { id: organizationId },
        data: { ownerId: newOwnerMember.userId! },
      });

      await tx.organizationMember.update({
        where: { id: newOwnerMember.id },
        data: { accessLevel: "owner" },
      });

      await tx.organizationMember.update({
        where: { id: currentOwnerMember.id },
        data: { accessLevel: input.demotedAccessLevel },
      });

      await tx.organizationActivity.create({
        data: {
          organizationId,
          actorId: currentOwnerId,
          actorName,
          action: "ownership.transferred",
          summary: `mentransfer kepemilikan ke ${newOwnerName} dan menjadi ${input.demotedAccessLevel}`,
          metadata: {
            fromOwnerId: currentOwnerId,
            toOwnerMemberId: newOwnerMember.id,
            toOwnerUserId: newOwnerMember.userId,
            demotedAccessLevel: input.demotedAccessLevel,
          },
        },
      });
    });

    return "ok" as const;
  }

  async leaveOrganization(organizationId: string, userId: string, actorName: string) {
    const organization = await prismaClient.organization.findUnique({
      where: { id: organizationId },
      select: { id: true, ownerId: true, name: true },
    });

    if (!organization) return "not_found" as const;

    if (organization.ownerId === userId) {
      await prismaClient.organization.delete({ where: { id: organizationId } });
      return { deleted: true as const };
    }

    const member = await prismaClient.organizationMember.findFirst({
      where: { organizationId, userId },
      select: { id: true, email: true },
    });

    if (!member) return "forbidden" as const;

    await prismaClient.organizationMember.delete({ where: { id: member.id } });

    await this.createActivity({
      organizationId,
      actorId: userId,
      actorName,
      action: "member.left",
      summary: `meninggalkan organisasi`,
      metadata: { memberId: member.id, email: member.email },
    });

    return { deleted: false as const };
  }

  async createActivity(input: {
    organizationId: string;
    actorId: string | null;
    actorName: string;
    action: string;
    summary: string;
    metadata?: unknown;
  }) {
    return prismaClient.organizationActivity.create({
      data: {
        organizationId: input.organizationId,
        actorId: input.actorId,
        actorName: input.actorName,
        action: input.action,
        summary: input.summary,
        metadata: input.metadata as Prisma.InputJsonValue | undefined,
      },
    });
  }
}
