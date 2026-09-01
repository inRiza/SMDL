import { Prisma, PrismaClient } from "@prisma/client";

const SCHEMA_VERSION = 16;

function generatedClientHasUserStatus() {
  const user = Prisma.dmmf.datamodel.models.find((model) => model.name === "User");
  return user?.fields.some((field) => field.name === "accountStatus") ?? false;
}

function generatedClientHasAuditModels() {
  return Prisma.dmmf.datamodel.models.some((model) => model.name === "AuditEvent");
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaSchemaVersion: number | undefined;
};

function generatedClientHasDocumentMetadata() {
  const document = Prisma.dmmf.datamodel.models.find((model) => model.name === "Document");
  const hasMetadata = document?.fields.some((field) => field.name === "documentType") ?? false;
  const hasOwnerRelation = document?.fields.some((field) => field.name === "owner") ?? false;
  return hasMetadata && hasOwnerRelation;
}

function createPrismaClient() {
  const client = new PrismaClient({
    log: ["error", "warn"],
  });
  void client.$connect().catch((error) => {
    console.warn(
      "[prisma] connect failed",
      error instanceof Error ? error.message : error
    );
  });
  return client;
}

function clientLooksCurrent(client: PrismaClient) {
  return (
    generatedClientHasDocumentMetadata() &&
    generatedClientHasAuditModels() &&
    generatedClientHasUserStatus() &&
    "documentSection" in client &&
    "documentEntity" in client &&
    "outboxEvent" in client
  );
}

function resolvePrismaClient(): PrismaClient {
  const cached = globalForPrisma.prisma;
  const versionOk = globalForPrisma.prismaSchemaVersion === SCHEMA_VERSION;

  if (cached && versionOk && clientLooksCurrent(cached)) {
    return cached;
  }

  // never $disconnect() the previous client here. bun --watch + the outbox
  // poller share one query engine; disconnecting mid-query surfaces
  // "Engine is not yet connected" and empty transaction responses.
  const client = createPrismaClient();
  globalForPrisma.prisma = client;
  globalForPrisma.prismaSchemaVersion = SCHEMA_VERSION;
  return client;
}

export const prismaClient: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = resolvePrismaClient();
    const value = Reflect.get(client, prop, client) as unknown;
    return typeof value === "function" ? value.bind(client) : value;
  },
});

export async function ensurePrismaConnected() {
  await resolvePrismaClient().$connect();
}

export function isPrismaTransientError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("Engine is not yet connected") ||
    message.includes("Response from the Engine was empty") ||
    message.includes("Can't reach database server") ||
    message.includes("Timed out fetching a new connection")
  );
}

export async function withPrismaRetry<T>(
  fn: () => Promise<T>,
  attempts = 3
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      await ensurePrismaConnected();
      return await fn();
    } catch (error) {
      lastError = error;
      if (!isPrismaTransientError(error) || attempt === attempts) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 400 * attempt));
    }
  }

  throw lastError;
}
