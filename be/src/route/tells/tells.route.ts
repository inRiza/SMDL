import { Hono } from "hono";
import { TellsController } from "./tells.controller";

const tellsRoute = new Hono();
const controller = new TellsController();

tellsRoute.get("/conversations", controller.listConversations);
tellsRoute.post("/conversations", controller.createConversation);
tellsRoute.get("/conversations/:id", controller.getConversation);
tellsRoute.delete("/conversations/:id", controller.deleteConversation);
tellsRoute.post("/chat", controller.chat);

export { tellsRoute };
