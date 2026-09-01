import { Hono } from "hono";
import type { AppEnv } from "@/types/hono";
import { AdminAccountController } from "./admin-account.controller";
import { AdminSystemController } from "./admin-system.controller";
import { AdminUserController } from "./admin-user.controller";

const adminUserController = new AdminUserController();
const adminAccountController = new AdminAccountController();
const adminSystemController = new AdminSystemController();

export const adminRoute = new Hono<AppEnv>();

adminRoute.get("/users", adminUserController.list);
adminRoute.get("/users/:id", adminUserController.getById);

adminRoute.patch("/accounts/:id", adminAccountController.update);
adminRoute.delete("/accounts/:id", adminAccountController.softDelete);

adminRoute.get("/system/health", adminSystemController.health);
