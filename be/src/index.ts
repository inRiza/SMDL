import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { documentRoute } from './route/document/document.route';

const app = new Hono()

app.use("*", cors({
  origin: ["http://localhost:3000"],
  credentials: true,
}));

app.get("/health", (c) => c.json({ status: "ok" }));

app.route("/api/documents", documentRoute);

export default app