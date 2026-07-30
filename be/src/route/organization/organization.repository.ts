import type { Prisma } from "@prisma/client";
import { prismaClient } from "@/lib/db/prisma";
import type {
  CreateOrganizationInput,
  InviteOrganizationMembersInput,
  OrganizationListQueryInput,
} from "@/validators/organization.validator";

function buildWhere(query: OrganizationListQueryInput): Prisma.OrganizationWhereInput {
  const where: Prisma.OrganizationWhereInput = {};

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
  async findMany(query: OrganizationListQueryInput) {
    const where = buildWhere(query);
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
          _count: {
            select: { documents: true },
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
          select: { email: true },
        },
        _count: {
          select: { documents: true },
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

      return organization;
    });
  }

  async findOwnedOrganization(organizationId: string, ownerId: string) {
    return prismaClient.organization.findFirst({
      where: { id: organizationId, ownerId },
      select: { id: true, ownerId: true },
    });
  }

  async createInvites(
    organizationId: string,
    invitedById: string,
    invites: InviteOrganizationMembersInput["invites"]
  ) {
    const normalized = invites.map((invite) => ({
      organizationId,
      email: invite.email.toLowerCase(),
      accessLevel: invite.accessLevel ?? "member",
      status: "pending" as const,
      invitedById,
    }));

    await prismaClient.organizationMember.createMany({
      data: normalized,
      skipDuplicates: true,
    });

    return prismaClient.organizationMember.findMany({
      where: {
        organizationId,
        email: { in: normalized.map((item) => item.email) },
      },
      select: {
        id: true,
        email: true,
        accessLevel: true,
        status: true,
      },
    });
  }
}
