import { Hono } from "hono";
import { DocumentController } from "./document.controller";

const documentRoute = new Hono();
const controller = new DocumentController();

documentRoute.get("/", controller.list);
documentRoute.get("/categories", controller.categories);
documentRoute.get("/:id", controller.getById);

export { documentRoute };