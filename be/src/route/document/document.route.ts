import { Hono } from "hono";
import { DocumentController } from "./document.controller";

const documentRoute = new Hono();
const controller = new DocumentController();

documentRoute.get("/workspace", controller.workspace);
documentRoute.get("/", controller.list);
documentRoute.get("/categories", controller.categories);
documentRoute.post("/", controller.create);
documentRoute.get("/:id", controller.getById);
documentRoute.patch("/:id", controller.update);
documentRoute.delete("/:id", controller.revoke);

export { documentRoute };
