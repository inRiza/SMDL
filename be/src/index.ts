import { Hono } from "hono";
import { cors } from "hono/cors";
import { authMiddleware } from "./lib/auth/auth.middleware";
import { env } from "./lib/config/env.config";
import { authRoute } from "./route/auth/auth.route";
import { documentRoute } from "./route/document/document.route";
import { tellsRoute } from "./route/tells/tells.route";
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

app.get("/health", (c) => c.json({ status: "ok" }));

app.route("/api/auth", authRoute);
app.route("/api/documents", documentRoute);
app.route("/api/tells", tellsRoute);

export default {
  port: env.PORT,
  fetch: app.fetch,
};

console.log(`Backend running on http://localhost:${env.PORT}`);
