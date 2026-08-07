import type { Prisma } from "@prisma/client";
import { prismaClient } from "@/lib/db/prisma";

export type DocumentAccessContext = {
  visibility: "public" | "organization";
  organizationId: string | null;
};

export async function getAccessibleOrganizationIds(userId: string) {
  const [owned, memberships] = await Promise.all([
    prismaClient.organization.findMany({
      where: { ownerId: userId },
      select: { id: true },
    }),
    prismaClient.organizationMember.findMany({
      where: { userId, status: "accepted" },
      select: { organizationId: true },
    }),
  ]);

  return new Set([
    ...owned.map((organization) => organization.id),
    ...memberships.map((membership) => membership.organizationId),
  ]);
}

export function buildDocumentAccessWhere(
  userId: string | undefined,
  accessibleOrgIds: Iterable<string>
): Prisma.DocumentWhereInput {
  const orgIds = [...accessibleOrgIds];

  if (!userId) {
    return { visibility: "public" };
  }

  if (orgIds.length === 0) {
    return { visibility: "public" };
  }

  return {
    OR: [
      { visibility: "public" },
      {
        visibility: "organization",
        organizationId: { in: orgIds },
      },
    ],
  };
}

export async function canAccessDocument(
  userId: string | undefined,
  document: DocumentAccessContext,
  accessibleOrgIds?: Set<string>
) {
  if (document.visibility === "public") {
    return true;
  }

  if (!userId || !document.organizationId) {
    return false;
  }

  const orgIds = accessibleOrgIds ?? (await getAccessibleOrganizationIds(userId));
  return orgIds.has(document.organizationId);
}
