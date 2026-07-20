import { PrismaClient } from "@prisma/client";
import { env } from "../config/env.config";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

export const prismaClient = globalForPrisma.prisma ?? new PrismaClient({
    log: ["error", "warn"],
});

if (env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prismaClient;
}