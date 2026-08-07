import { Hono } from "hono";
import { UserController } from "./user.controller";

const userRoute = new Hono();
const controller = new UserController();

userRoute.get("/", controller.list);

export { userRoute };
