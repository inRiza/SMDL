import { Hono } from "hono";
import type { AppEnv } from "@/types/hono";
import { AuditController } from "./audit.controller";

const controller = new AuditController();

export const auditRoute = new Hono<AppEnv>();

auditRoute.get("/", controller.list);
auditRoute.get("/overview", controller.overview);
auditRoute.get("/:id", controller.getById);
