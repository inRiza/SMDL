import type { Prisma } from "@prisma/client";
import { prismaClient } from "@/lib/db/prisma";
import type { UserListQueryInput } from "@/validators/user.validator";

export class UserRepository {
  async findMany(query: UserListQueryInput, excludeUserId?: string) {
    const where: Prisma.UserWhereInput = {};

    if (excludeUserId) {
      where.id = { not: excludeUserId };
    }

    if (query.q) {
      where.OR = [
        { name: { contains: query.q, mode: "insensitive" } },
        { email: { contains: query.q, mode: "insensitive" } },
      ];
    }

    const skip = (query.page - 1) * query.limit;

    const [rows, total] = await Promise.all([
      prismaClient.user.findMany({
        where,
        orderBy: { name: "asc" },
        skip,
        take: query.limit,
        select: {
          id: true,
          name: true,
          email: true,
        },
      }),
      prismaClient.user.count({ where }),
    ]);

    return { rows, total };
  }
}
