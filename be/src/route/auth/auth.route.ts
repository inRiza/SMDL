import { Hono } from "hono";
import type { AppEnv } from "@/types/hono";
import { AuthController } from "./auth.controller";

const authRoute = new Hono<AppEnv>();
const controller = new AuthController();

authRoute.post("/login", controller.login);
authRoute.post("/logout", controller.logout);
authRoute.get("/me", controller.me);

export { authRoute };
