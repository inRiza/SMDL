import type { Context } from "hono";
import { getRequestUserId } from "@/lib/auth/request-user";
import {
  CreateOrganizationSchema,
  InviteOrganizationMembersSchema,
  OrganizationListQuerySchema,
} from "@/validators/organization.validator";
import { OrganizationService } from "./organization.service";

export class OrganizationController {
  constructor(
    private readonly service: OrganizationService = new OrganizationService()
  ) {}

  list = async (c: Context) => {
    const parsed = OrganizationListQuerySchema.safeParse(c.req.query());

    if (!parsed.success) {
      return c.json(
        {
          error: "Invalid query parameters",
          details: parsed.error.flatten().fieldErrors,
        },
        400
      );
    }

    const result = await this.service.listOrganizations(parsed.data);
    return c.json(result);
  };

  getById = async (c: Context) => {
    const id = c.req.param("id");
    if (!id) {
      return c.json({ error: "Organization id is required" }, 400);
    }

    const organization = await this.service.getOrganization(id);
    if (!organization) {
      return c.json({ error: "Organization not found" }, 404);
    }

    return c.json(organization);
  };

  create = async (c: Context) => {
    const userId = getRequestUserId(c);
    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const body = await c.req.json().catch(() => null);
    const parsed = CreateOrganizationSchema.safeParse(body);

    if (!parsed.success) {
      return c.json(
        {
          error: "Invalid request body",
          details: parsed.error.flatten().fieldErrors,
        },
        400
      );
    }

    const userEmail = c.get("userEmail");
    if (typeof userEmail !== "string" || !userEmail) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const organization = await this.service.createOrganization(
      parsed.data,
      userId,
      userEmail
    );
    return c.json(organization, 201);
  };

  inviteMembers = async (c: Context) => {
    const userId = getRequestUserId(c);
    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const id = c.req.param("id");
    if (!id) {
      return c.json({ error: "Organization id is required" }, 400);
    }

    const body = await c.req.json().catch(() => null);
    const parsed = InviteOrganizationMembersSchema.safeParse(body);

    if (!parsed.success) {
      return c.json(
        {
          error: "Invalid request body",
          details: parsed.error.flatten().fieldErrors,
        },
        400
      );
    }

    const result = await this.service.inviteMembers(id, userId, parsed.data);
    if (!result) {
      return c.json({ error: "Organization not found or forbidden" }, 403);
    }

    return c.json(result, 201);
  };
}
