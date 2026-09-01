import type { Prisma } from "@prisma/client";
import { prismaClient } from "@/lib/db/prisma";
import type { AuditListQuery } from "@/validators/audit.validator";

type CursorPayload = {
  occurredAt: string;
  id: string;
};

function encodeCursor(payload: CursorPayload) {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function decodeCursor(cursor: string): CursorPayload | null {
  try {
    const raw = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as CursorPayload;
    if (!raw.occurredAt || !raw.id) return null;
    return raw;
  } catch {
    return null;
  }
}

export class AuditRepository {
  async list(query: AuditListQuery) {
    const where: Prisma.AuditEventWhereInput = {};

    if (query.from || query.to) {
      where.occurredAt = {};
      if (query.from) where.occurredAt.gte = new Date(query.from);
      if (query.to) where.occurredAt.lte = new Date(query.to);
    }

    if (query.eventType) where.eventType = query.eventType;
    if (query.userId) where.userId = query.userId;
    if (query.status) where.status = query.status;

    if (query.q) {
      where.OR = [
        { summary: { contains: query.q, mode: "insensitive" } },
        { userEmail: { contains: query.q, mode: "insensitive" } },
        { userName: { contains: query.q, mode: "insensitive" } },
        { eventType: { contains: query.q, mode: "insensitive" } },
      ];
    }

    if (query.cursor) {
      const decoded = decodeCursor(query.cursor);
      if (!decoded) {
        return { error: "INVALID_CURSOR" as const };
      }

      const occurredAt = new Date(decoded.occurredAt);
      where.AND = [
        {
          OR: [
            { occurredAt: { lt: occurredAt } },
            { occurredAt, id: { lt: decoded.id } },
          ],
        },
      ];
    }

    const rows = await prismaClient.auditEvent.findMany({
      where,
      orderBy: [{ occurredAt: "desc" }, { id: "desc" }],
      take: query.limit + 1,
    });

    const hasMore = rows.length > query.limit;
    const data = hasMore ? rows.slice(0, query.limit) : rows;
    const last = data.at(-1);

    return {
      data: data.map((row) => ({
        id: row.id,
        eventId: row.eventId,
        eventType: row.eventType,
        service: row.service,
        userId: row.userId,
        userEmail: row.userEmail,
        userName: row.userName,
        aggregateId: row.aggregateId,
        aggregateType: row.aggregateType,
        requestId: row.requestId,
        ipAddress: row.ipAddress,
        status: row.status,
        summary: row.summary,
        payload: row.payload,
        metadata: row.metadata,
        occurredAt: row.occurredAt.toISOString(),
      })),
      nextCursor:
        hasMore && last
          ? encodeCursor({ occurredAt: last.occurredAt.toISOString(), id: last.id })
          : null,
      hasMore,
    };
  }

  async getById(id: string) {
    const row = await prismaClient.auditEvent.findUnique({ where: { id } });
    if (!row) return null;

    return {
      id: row.id,
      eventId: row.eventId,
      eventType: row.eventType,
      service: row.service,
      userId: row.userId,
      userEmail: row.userEmail,
      userName: row.userName,
      aggregateId: row.aggregateId,
      aggregateType: row.aggregateType,
      requestId: row.requestId,
      ipAddress: row.ipAddress,
      status: row.status,
      summary: row.summary,
      payload: row.payload,
      metadata: row.metadata,
      occurredAt: row.occurredAt.toISOString(),
      createdAt: row.createdAt.toISOString(),
    };
  }

  async getOverviewStats() {
    const [total, last24h, failed24h, pendingOutbox] = await Promise.all([
      prismaClient.auditEvent.count(),
      prismaClient.auditEvent.count({
        where: { occurredAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      }),
      prismaClient.auditEvent.count({
        where: {
          status: "failure",
          occurredAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
      prismaClient.outboxEvent.count({ where: { status: "pending" } }),
    ]);

    return { total, last24h, failed24h, pendingOutbox };
  }
}
