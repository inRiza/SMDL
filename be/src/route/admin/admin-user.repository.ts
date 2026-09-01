import type { Prisma, UserRole } from "@prisma/client";
import { prismaClient } from "@/lib/db/prisma";
import type { AdminUserListQuery } from "@/validators/admin-user.validator";

type AuditAgg = {
  userId: string;
  total: number;
  failed: number;
  failed24h: number;
  loginFailed: number;
  lastActivityAt: Date | null;
};

async function loadAuditAggregates(userIds: string[]): Promise<Map<string, AuditAgg>> {
  const map = new Map<string, AuditAgg>();
  if (userIds.length === 0) return map;

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [totals, failed, failed24h, loginFailed, lastActivity] = await Promise.all([
    prismaClient.auditEvent.groupBy({
      by: ["userId"],
      where: { userId: { in: userIds } },
      _count: { _all: true },
    }),
    prismaClient.auditEvent.groupBy({
      by: ["userId"],
      where: { userId: { in: userIds }, status: "failure" },
      _count: { _all: true },
    }),
    prismaClient.auditEvent.groupBy({
      by: ["userId"],
      where: {
        userId: { in: userIds },
        status: "failure",
        occurredAt: { gte: since24h },
      },
      _count: { _all: true },
    }),
    prismaClient.auditEvent.groupBy({
      by: ["userId"],
      where: { userId: { in: userIds }, eventType: "AUTH_LOGIN_FAILED" },
      _count: { _all: true },
    }),
    prismaClient.auditEvent.groupBy({
      by: ["userId"],
      where: { userId: { in: userIds } },
      _max: { occurredAt: true },
    }),
  ]);

  for (const id of userIds) {
    map.set(id, {
      userId: id,
      total: 0,
      failed: 0,
      failed24h: 0,
      loginFailed: 0,
      lastActivityAt: null,
    });
  }

  for (const row of totals) {
    if (!row.userId) continue;
    const entry = map.get(row.userId);
    if (entry) entry.total = row._count._all;
  }
  for (const row of failed) {
    if (!row.userId) continue;
    const entry = map.get(row.userId);
    if (entry) entry.failed = row._count._all;
  }
  for (const row of failed24h) {
    if (!row.userId) continue;
    const entry = map.get(row.userId);
    if (entry) entry.failed24h = row._count._all;
  }
  for (const row of loginFailed) {
    if (!row.userId) continue;
    const entry = map.get(row.userId);
    if (entry) entry.loginFailed = row._count._all;
  }
  for (const row of lastActivity) {
    if (!row.userId) continue;
    const entry = map.get(row.userId);
    if (entry) entry.lastActivityAt = row._max.occurredAt;
  }

  return map;
}

function computeRiskLevel(agg: AuditAgg) {
  if (agg.failed24h >= 3 || agg.loginFailed >= 5) return "high" as const;
  if (agg.failed24h >= 1 || agg.failed >= 3) return "medium" as const;
  return "low" as const;
}

export class AdminUserRepository {
  async list(query: AdminUserListQuery) {
    const where: Prisma.UserWhereInput = {};

    if (query.q) {
      where.OR = [
        { name: { contains: query.q, mode: "insensitive" } },
        { email: { contains: query.q, mode: "insensitive" } },
      ];
    }

    if (query.role) {
      where.role = query.role as UserRole;
    }

    if (query.status) {
      where.accountStatus = query.status;
    } else {
      where.accountStatus = { not: "deleted" };
    }

    const users = await prismaClient.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        accountStatus: true,
        deactivatedAt: true,
        deletedAt: true,
        createdAt: true,
      },
    });

    const userIds = users.map((u) => u.id);
    const aggMap = await loadAuditAggregates(userIds);

    const merged = users.map((user) => {
      const agg = aggMap.get(user.id) ?? {
        userId: user.id,
        total: 0,
        failed: 0,
        failed24h: 0,
        loginFailed: 0,
        lastActivityAt: null,
      };

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.accountStatus,
        deactivatedAt: user.deactivatedAt?.toISOString() ?? null,
        deletedAt: user.deletedAt?.toISOString() ?? null,
        createdAt: user.createdAt.toISOString(),
        audit: {
          totalLogs: agg.total,
          failedLogs: agg.failed,
          failedLogs24h: agg.failed24h,
          loginFailedCount: agg.loginFailed,
          lastActivityAt: agg.lastActivityAt?.toISOString() ?? null,
          riskLevel: computeRiskLevel(agg),
        },
      };
    });

    const sorted = [...merged];
    switch (query.sort) {
      case "name_desc":
        sorted.sort((a, b) => b.name.localeCompare(a.name, "id"));
        break;
      case "logs_desc":
        sorted.sort((a, b) => b.audit.totalLogs - a.audit.totalLogs);
        break;
      case "failed_desc":
        sorted.sort((a, b) => b.audit.failedLogs - a.audit.failedLogs);
        break;
      case "activity_desc":
        sorted.sort((a, b) => {
          const aTime = a.audit.lastActivityAt ? new Date(a.audit.lastActivityAt).getTime() : 0;
          const bTime = b.audit.lastActivityAt ? new Date(b.audit.lastActivityAt).getTime() : 0;
          return bTime - aTime;
        });
        break;
      default:
        sorted.sort((a, b) => a.name.localeCompare(b.name, "id"));
    }

    const total = sorted.length;
    const skip = (query.page - 1) * query.limit;
    const data = sorted.slice(skip, skip + query.limit);

    return {
      data,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
      },
    };
  }

  async getById(id: string) {
    const user = await prismaClient.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        accountStatus: true,
        deactivatedAt: true,
        deletedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) return null;

    const aggMap = await loadAuditAggregates([user.id]);
    const agg = aggMap.get(user.id)!;
    const riskLevel = computeRiskLevel(agg);

    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const logs24h = await prismaClient.auditEvent.count({
      where: { userId: user.id, occurredAt: { gte: since24h } },
    });

    const lastLogin = await prismaClient.auditEvent.findFirst({
      where: { userId: user.id, eventType: "AUTH_LOGIN", status: "success" },
      orderBy: { occurredAt: "desc" },
      select: { occurredAt: true, ipAddress: true },
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.accountStatus,
      deactivatedAt: user.deactivatedAt?.toISOString() ?? null,
      deletedAt: user.deletedAt?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      audit: {
        totalLogs: agg.total,
        failedLogs: agg.failed,
        failedLogs24h: agg.failed24h,
        loginFailedCount: agg.loginFailed,
        logs24h,
        lastActivityAt: agg.lastActivityAt?.toISOString() ?? null,
        lastLoginAt: lastLogin?.occurredAt.toISOString() ?? null,
        lastLoginIp: lastLogin?.ipAddress ?? null,
        riskLevel,
      },
    };
  }
}
