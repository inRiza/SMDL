import { Hono } from "hono";
import { DocumentController } from "./document.controller";
import { LerController } from "./ler.controller";

const documentRoute = new Hono();
const controller = new DocumentController();
const lerController = new LerController();

documentRoute.get("/workspace", controller.workspace);
documentRoute.get("/", controller.list);
documentRoute.get("/categories", controller.categories);
documentRoute.post("/", controller.create);

documentRoute.get("/:id/ler/stream", lerController.stream);
documentRoute.get("/:id/ler", lerController.getStatus);
documentRoute.post("/:id/ler/generate", lerController.generate);
documentRoute.post("/:id/ler/retry", lerController.retry);

documentRoute.get("/:id/file", controller.getFile);
documentRoute.get("/:id", controller.getById);
documentRoute.patch("/:id", controller.update);
documentRoute.delete("/:id", controller.revoke);

export { documentRoute };
