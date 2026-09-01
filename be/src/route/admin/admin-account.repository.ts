import type { UserRole } from "@prisma/client";
import { AUDIT_EVENT_TYPES } from "@/lib/audit/audit-event-types";
import { recordAudit } from "@/lib/audit/record-audit";
import { prismaClient } from "@/lib/db/prisma";
import type { AdminAccountUpdateInput } from "@/validators/admin-account.validator";

export class AdminAccountRepository {
  async findById(id: string) {
    return prismaClient.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        accountStatus: true,
      },
    });
  }

  async updateAccount(
    targetId: string,
    input: AdminAccountUpdateInput,
    actor: { id: string; email: string; name: string }
  ) {
    const target = await this.findById(targetId);
    if (!target || target.accountStatus === "deleted") return { error: "NOT_FOUND" as const };

    const data: {
      role?: UserRole;
      accountStatus?: "active" | "deactivated";
      deactivatedAt?: Date | null;
    } = {};

    if (input.role && input.role !== target.role) {
      data.role = input.role;
    }

    if (input.status && input.status !== target.accountStatus) {
      data.accountStatus = input.status;
      data.deactivatedAt = input.status === "deactivated" ? new Date() : null;
    }

    if (Object.keys(data).length === 0) {
      return { error: "NO_CHANGES" as const };
    }

    const updated = await prismaClient.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: targetId },
        data,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          accountStatus: true,
          deactivatedAt: true,
        },
      });

      if (data.role || data.accountStatus === "deactivated") {
        await tx.session.deleteMany({ where: { userId: targetId } });
      }

      return user;
    });

    if (data.role) {
      void recordAudit({
        eventType: AUDIT_EVENT_TYPES.USER_ROLE_CHANGED,
        summary: `${actor.email} mengubah peran ${target.email} menjadi ${updated.role}`,
        userId: actor.id,
        userEmail: actor.email,
        userName: actor.name,
        aggregateId: targetId,
        aggregateType: "user",
        payload: { from: target.role, to: updated.role, targetEmail: target.email },
      }).catch(console.error);
    }

    if (data.accountStatus) {
      void recordAudit({
        eventType: AUDIT_EVENT_TYPES.USER_STATUS_CHANGED,
        summary: `${actor.email} mengubah status ${target.email} menjadi ${updated.accountStatus}`,
        userId: actor.id,
        userEmail: actor.email,
        userName: actor.name,
        aggregateId: targetId,
        aggregateType: "user",
        payload: {
          from: target.accountStatus,
          to: updated.accountStatus,
          targetEmail: target.email,
        },
      }).catch(console.error);
    }

    return {
      data: {
        ...updated,
        status: updated.accountStatus,
        deactivatedAt: updated.deactivatedAt?.toISOString() ?? null,
      },
    };
  }

  async softDelete(
    targetId: string,
    actor: { id: string; email: string; name: string }
  ) {
    const target = await this.findById(targetId);
    if (!target || target.accountStatus === "deleted") return { error: "NOT_FOUND" as const };

    await prismaClient.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: targetId },
        data: {
          accountStatus: "deleted",
          deletedAt: new Date(),
        },
      });
      await tx.session.deleteMany({ where: { userId: targetId } });
    });

    void recordAudit({
      eventType: AUDIT_EVENT_TYPES.USER_DELETED,
      summary: `${actor.email} menghapus akun ${target.email} (soft delete)`,
      userId: actor.id,
      userEmail: actor.email,
      userName: actor.name,
      aggregateId: targetId,
      aggregateType: "user",
      payload: { targetEmail: target.email, targetRole: target.role },
    }).catch(console.error);

    return { ok: true as const };
  }
}
