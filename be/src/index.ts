import { Hono } from "hono";
import { cors } from "hono/cors";
import { ensureAuditPipeline } from "@/lib/audit/start-audit-pipeline";
import { authMiddleware } from "./lib/auth/auth.middleware";
import { env } from "./lib/config/env.config";
import { ensurePrismaConnected } from "./lib/db/prisma";
import { auditRoute } from "./route/audit/audit.route";
import { adminRoute } from "./route/admin/admin.route";
import { authRoute } from "./route/auth/auth.route";
import { documentRoute } from "./route/document/document.route";
import { organizationRoute } from "./route/organization/organization.route";
import { tellsRoute } from "./route/tells/tells.route";
import { userRoute } from "./route/user/user.route";
import type { AppEnv } from "./types/hono";

const app = new Hono<AppEnv>();

app.use(
  "*",
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000", "http://localhost:3002"],
    credentials: true,
  })
);

app.use("*", authMiddleware);

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: "Internal server error" }, 500);
});

app.get("/health", (c) => c.json({ status: "ok" }));

app.route("/api/auth", authRoute);
app.route("/api/documents", documentRoute);
app.route("/api/organizations", organizationRoute);
app.route("/api/users", userRoute);
app.route("/api/tells", tellsRoute);
app.route("/api/audit", auditRoute);
app.route("/api/admin", adminRoute);

ensureAuditPipeline();
void ensurePrismaConnected();

export default {
  port: env.PORT,
  fetch: app.fetch,
  // LER extraction streams (SSE) stay open well past Bun's 10s default
  idleTimeout: 255,
};

console.log(`Backend running on http://localhost:${env.PORT}`);
