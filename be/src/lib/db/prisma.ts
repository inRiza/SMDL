import { PrismaClient } from "@prisma/client";
import { env } from "../config/env.config";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  return new PrismaClient({
    log: ["error", "warn"],
  });
}

function getPrismaClient() {
  const cached = globalForPrisma.prisma;

  // hot reload can keep an old client after `prisma generate`
  if (cached && "tellsChat" in cached && "organization" in cached && "organizationMember" in cached) {
    return cached;
  }

  const client = createPrismaClient();
  if (env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }

  return client;
}

export const prismaClient = getPrismaClient();