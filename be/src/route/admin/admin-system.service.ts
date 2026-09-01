import { prismaClient } from "@/lib/db/prisma";
import { env } from "@/lib/config/env.config";
import { checkLerServiceHealth } from "@/lib/ler/ler.client";
import { getKafka } from "@/lib/kafka/kafka.client";
import Redis from "ioredis";

export type ComponentStatus = "healthy" | "degraded" | "down";

export type SystemComponentHealth = {
  id: string;
  name: string;
  category: "infrastructure" | "api";
  endpoint: string;
  status: ComponentStatus;
  latencyMs: number | null;
  message: string;
  checkedAt: string;
};

async function timed<T>(fn: () => Promise<T>): Promise<{ result: T; latencyMs: number }> {
  const start = Date.now();
  const result = await fn();
  return { result, latencyMs: Date.now() - start };
}

async function checkPostgres(): Promise<Omit<SystemComponentHealth, "id" | "name" | "category" | "endpoint" | "checkedAt">> {
  try {
    const { latencyMs } = await timed(() => prismaClient.$queryRaw`SELECT 1`);
    return { status: "healthy", latencyMs, message: "Koneksi PostgreSQL OK" };
  } catch (error) {
    return {
      status: "down",
      latencyMs: null,
      message: error instanceof Error ? error.message : "PostgreSQL tidak dapat dijangkau",
    };
  }
}

async function checkRedis(): Promise<Omit<SystemComponentHealth, "id" | "name" | "category" | "endpoint" | "checkedAt">> {
  const redis = new Redis(env.REDIS_URL, { connectTimeout: 3000, maxRetriesPerRequest: 1 });
  try {
    const { result, latencyMs } = await timed(() => redis.ping());
    return {
      status: result === "PONG" ? "healthy" : "degraded",
      latencyMs,
      message: result === "PONG" ? "Redis merespons PONG" : "Redis respons tidak expected",
    };
  } catch (error) {
    return {
      status: "down",
      latencyMs: null,
      message: error instanceof Error ? error.message : "Redis tidak dapat dijangkau",
    };
  } finally {
    redis.disconnect();
  }
}

async function checkKafka(): Promise<Omit<SystemComponentHealth, "id" | "name" | "category" | "endpoint" | "checkedAt">> {
  const admin = getKafka().admin();
  try {
    const { latencyMs } = await timed(async () => {
      await admin.connect();
      await admin.listTopics();
      await admin.disconnect();
    });
    return { status: "healthy", latencyMs, message: "Broker Kafka tersedia" };
  } catch (error) {
    await admin.disconnect().catch(() => undefined);
    return {
      status: "down",
      latencyMs: null,
      message: error instanceof Error ? error.message : "Kafka tidak dapat dijangkau",
    };
  }
}

async function checkLer(): Promise<Omit<SystemComponentHealth, "id" | "name" | "category" | "endpoint" | "checkedAt">> {
  const start = Date.now();
  try {
    const ok = await checkLerServiceHealth();
    const latencyMs = Date.now() - start;
    return {
      status: ok ? "healthy" : "degraded",
      latencyMs,
      message: ok ? "LER service merespons" : "LER service tidak healthy",
    };
  } catch (error) {
    return {
      status: "down",
      latencyMs: null,
      message: error instanceof Error ? error.message : "LER service tidak dapat dijangkau",
    };
  }
}

async function checkApiRoute(
  path: string,
  okStatuses: number[] = [200, 401, 403]
): Promise<Omit<SystemComponentHealth, "id" | "name" | "category" | "endpoint" | "checkedAt">> {
  const url = `http://127.0.0.1:${env.PORT}${path}`;
  const start = Date.now();
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    const latencyMs = Date.now() - start;
    const ok = okStatuses.includes(response.status);
    return {
      status: ok ? "healthy" : "degraded",
      latencyMs,
      message: ok ? `HTTP ${response.status}` : `Respons tidak expected: HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      status: "down",
      latencyMs: null,
      message: error instanceof Error ? error.message : "Endpoint tidak dapat dijangkau",
    };
  }
}

export class AdminSystemService {
  async getHealth() {
    const checkedAt = new Date().toISOString();

    const [
      postgres,
      redis,
      kafka,
      ler,
      apiCore,
      auth,
      documents,
      organizations,
      users,
      tells,
      audit,
      admin,
    ] = await Promise.all([
      checkPostgres(),
      checkRedis(),
      checkKafka(),
      checkLer(),
      checkApiRoute("/health", [200]),
      checkApiRoute("/api/auth/me", [401]),
      checkApiRoute("/api/documents", [200, 401]),
      checkApiRoute("/api/organizations", [200, 401]),
      checkApiRoute("/api/users", [401]),
      checkApiRoute("/api/tells", [401]),
      checkApiRoute("/api/audit/overview", [401, 403]),
      checkApiRoute("/api/admin/users", [401, 403]),
    ]);

    const components: SystemComponentHealth[] = [
      { id: "postgres", name: "PostgreSQL", category: "infrastructure", endpoint: "postgres:5433", ...postgres, checkedAt },
      { id: "redis", name: "Redis", category: "infrastructure", endpoint: env.REDIS_URL, ...redis, checkedAt },
      { id: "kafka", name: "Kafka", category: "infrastructure", endpoint: env.KAFKA_BROKERS, ...kafka, checkedAt },
      { id: "ler", name: "LER Service", category: "infrastructure", endpoint: env.LER_SERVICE_URL, ...ler, checkedAt },
      { id: "api-core", name: "API Server", category: "api", endpoint: "/health", ...apiCore, checkedAt },
      { id: "api-auth", name: "Auth API", category: "api", endpoint: "/api/auth", ...auth, checkedAt },
      { id: "api-documents", name: "Documents API", category: "api", endpoint: "/api/documents", ...documents, checkedAt },
      { id: "api-organizations", name: "Organizations API", category: "api", endpoint: "/api/organizations", ...organizations, checkedAt },
      { id: "api-users", name: "Users API", category: "api", endpoint: "/api/users", ...users, checkedAt },
      { id: "api-tells", name: "TELLS API", category: "api", endpoint: "/api/tells", ...tells, checkedAt },
      { id: "api-audit", name: "Audit API", category: "api", endpoint: "/api/audit", ...audit, checkedAt },
      { id: "api-admin", name: "Admin API", category: "api", endpoint: "/api/admin", ...admin, checkedAt },
    ];

    const healthy = components.filter((c) => c.status === "healthy").length;
    const degraded = components.filter((c) => c.status === "degraded").length;
    const down = components.filter((c) => c.status === "down").length;

    return {
      summary: { total: components.length, healthy, degraded, down, checkedAt },
      components,
    };
  }
}
