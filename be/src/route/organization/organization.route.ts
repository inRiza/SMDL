import { Hono } from "hono";
import { OrganizationController } from "./organization.controller";

const organizationRoute = new Hono();
const controller = new OrganizationController();

organizationRoute.get("/", controller.list);
organizationRoute.get("/:id", controller.getById);
organizationRoute.post("/", controller.create);
organizationRoute.patch("/:id", controller.update);
organizationRoute.post("/:id/invites", controller.inviteMembers);
organizationRoute.patch("/:id/members/:memberId", controller.updateMember);
organizationRoute.delete("/:id/members/:memberId", controller.removeMember);
organizationRoute.post("/:id/transfer-ownership", controller.transferOwnership);
organizationRoute.post("/:id/leave", controller.leave);
organizationRoute.post("/:id/documents", controller.createDocument);
organizationRoute.patch("/:id/documents/:documentId", controller.updateDocument);
organizationRoute.delete("/:id/documents/:documentId", controller.revokeDocument);

export { organizationRoute };
