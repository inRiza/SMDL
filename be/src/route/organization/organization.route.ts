import { Hono } from "hono";
import { OrganizationController } from "./organization.controller";

const organizationRoute = new Hono();
const controller = new OrganizationController();

organizationRoute.get("/", controller.list);
organizationRoute.get("/:id", controller.getById);
organizationRoute.post("/", controller.create);
organizationRoute.post("/:id/invites", controller.inviteMembers);

export { organizationRoute };
