import { Prisma, PrismaClient } from "@prisma/client";
import { env } from "../config/env.config";

const SCHEMA_VERSION = 9;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaSchemaVersion: number | undefined;
};

function generatedClientHasDocumentVisibility() {
  const document = Prisma.dmmf.datamodel.models.find((model) => model.name === "Document");
  return document?.fields.some((field) => field.name === "visibility") ?? false;
}

function createPrismaClient() {
  return new PrismaClient({
    log: ["error", "warn"],
  });
}

function resolvePrismaClient(): PrismaClient {
  const cached = globalForPrisma.prisma;
  const versionOk = globalForPrisma.prismaSchemaVersion === SCHEMA_VERSION;

  if (
    cached &&
    versionOk &&
    generatedClientHasDocumentVisibility() &&
    "tellsChat" in cached &&
    "organization" in cached &&
    "organizationMember" in cached &&
    "organizationActivity" in cached &&
    "documentActivity" in cached
  ) {
    return cached;
  }

  if (cached) {
    void cached.$disconnect().catch(() => undefined);
  }

  const client = createPrismaClient();
  if (env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
    globalForPrisma.prismaSchemaVersion = SCHEMA_VERSION;
  }

  return client;
}

export const prismaClient: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = resolvePrismaClient();
    const value = Reflect.get(client, prop, client) as unknown;
    return typeof value === "function" ? value.bind(client) : value;
  },
});
