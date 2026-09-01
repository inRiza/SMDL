import type { Context } from "hono";
import { getRequestUserId } from "@/lib/auth/request-user";
import { parseUploadFormData } from "@/lib/upload/parse-upload";
import {
  CreateOrganizationSchema,
  InviteOrganizationMembersSchema,
  OrganizationListQuerySchema,
  UpdateMemberAccessSchema,
  UpdateOrganizationDocumentSchema,
  UpdateOrganizationSchema,
  TransferOwnershipSchema,
} from "@/validators/organization.validator";
import { OrganizationService } from "./organization.service";

function getActorName(c: Context) {
  const email = c.get("userEmail");
  return typeof email === "string" && email ? email : "Pengguna";
}

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

    const viewerId = getRequestUserId(c) ?? undefined;
    if (parsed.data.mine && !viewerId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const result = await this.service.listOrganizations(parsed.data, viewerId);
    return c.json(result);
  };

  getById = async (c: Context) => {
    const id = c.req.param("id");
    if (!id) {
      return c.json({ error: "Organization id is required" }, 400);
    }

    const viewerId = getRequestUserId(c) ?? undefined;
    const organization = await this.service.getOrganization(id, viewerId);
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

  update = async (c: Context) => {
    const userId = getRequestUserId(c);
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const id = c.req.param("id");
    if (!id) return c.json({ error: "Organization id is required" }, 400);

    const body = await c.req.json().catch(() => null);
    const parsed = UpdateOrganizationSchema.safeParse(body);
    if (!parsed.success) {
      return c.json(
        {
          error: "Invalid request body",
          details: parsed.error.flatten().fieldErrors,
        },
        400
      );
    }

    const result = await this.service.updateOrganization(
      id,
      userId,
      getActorName(c),
      parsed.data
    );
    if (!result) return c.json({ error: "Organization not found or forbidden" }, 403);
    return c.json(result);
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

    const result = await this.service.inviteMembers(
      id,
      userId,
      getActorName(c),
      parsed.data
    );
    if (!result) {
      return c.json({ error: "Organization not found or forbidden" }, 403);
    }

    return c.json(result, 201);
  };

  updateMember = async (c: Context) => {
    const userId = getRequestUserId(c);
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const organizationId = c.req.param("id");
    const memberId = c.req.param("memberId");
    if (!organizationId || !memberId) {
      return c.json({ error: "Organization id and member id are required" }, 400);
    }

    const body = await c.req.json().catch(() => null);
    const parsed = UpdateMemberAccessSchema.safeParse(body);
    if (!parsed.success) {
      return c.json(
        {
          error: "Invalid request body",
          details: parsed.error.flatten().fieldErrors,
        },
        400
      );
    }

    const result = await this.service.updateMemberAccess(
      organizationId,
      memberId,
      userId,
      getActorName(c),
      parsed.data
    );

    if (result === "forbidden") {
      return c.json({ error: "Organization not found or forbidden" }, 403);
    }
    if (result === "not_found") {
      return c.json({ error: "Member not found" }, 404);
    }

    return c.json({ ok: true });
  };

  removeMember = async (c: Context) => {
    const userId = getRequestUserId(c);
    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const organizationId = c.req.param("id");
    const memberId = c.req.param("memberId");
    if (!organizationId || !memberId) {
      return c.json({ error: "Organization id and member id are required" }, 400);
    }

    const result = await this.service.removeMember(
      organizationId,
      memberId,
      userId,
      getActorName(c)
    );

    if (result === "forbidden") {
      return c.json({ error: "Organization not found or forbidden" }, 403);
    }

    if (result === "not_found") {
      return c.json({ error: "Member not found" }, 404);
    }

    return c.json({ ok: true });
  };

  transferOwnership = async (c: Context) => {
    const userId = getRequestUserId(c);
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const organizationId = c.req.param("id");
    if (!organizationId) {
      return c.json({ error: "Organization id is required" }, 400);
    }

    const body = await c.req.json().catch(() => null);
    const parsed = TransferOwnershipSchema.safeParse(body);
    if (!parsed.success) {
      return c.json(
        {
          error: "Invalid request body",
          details: parsed.error.flatten().fieldErrors,
        },
        400
      );
    }

    const result = await this.service.transferOwnership(
      organizationId,
      userId,
      getActorName(c),
      parsed.data
    );

    if (result === "forbidden") {
      return c.json({ error: "Organization not found or forbidden" }, 403);
    }
    if (result === "not_found") {
      return c.json({ error: "Member not found" }, 404);
    }

    return c.json({ ok: true });
  };

  leave = async (c: Context) => {
    const userId = getRequestUserId(c);
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const organizationId = c.req.param("id");
    if (!organizationId) {
      return c.json({ error: "Organization id is required" }, 400);
    }

    const result = await this.service.leaveOrganization(
      organizationId,
      userId,
      getActorName(c)
    );

    if (result === "not_found") {
      return c.json({ error: "Organization not found" }, 404);
    }
    if (result === "forbidden") {
      return c.json({ error: "Anda bukan anggota organisasi ini" }, 403);
    }

    return c.json(result);
  };

  createDocument = async (c: Context) => {
    const userId = getRequestUserId(c);
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const id = c.req.param("id");
    if (!id) return c.json({ error: "Organization id is required" }, 400);

    try {
      const formData = await c.req.formData();
      const upload = await parseUploadFormData(formData);
      const visibility = formData.get("visibility");

      if (visibility !== "public" && visibility !== "organization") {
        return c.json({ error: "Visibility wajib diisi (public atau organization)" }, 400);
      }

      const document = await this.service.createDocument(id, userId, getActorName(c), {
        title: upload.title,
        description: upload.description,
        category: upload.category,
        fileFormat: upload.fileFormat,
        visibility,
        fileBuffer: upload.fileBuffer,
        fileName: upload.fileName,
        fileSizeBytes: upload.fileSizeBytes,
      });
      if (!document) {
        return c.json({ error: "Organization not found or forbidden" }, 403);
      }

      return c.json(document, 201);
    } catch (error) {
      return c.json(
        { error: error instanceof Error ? error.message : "Gagal mengunggah dokumen" },
        400
      );
    }
  };

  updateDocument = async (c: Context) => {
    const userId = getRequestUserId(c);
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const organizationId = c.req.param("id");
    const documentId = c.req.param("documentId");
    if (!organizationId || !documentId) {
      return c.json({ error: "Organization id and document id are required" }, 400);
    }

    const body = await c.req.json().catch(() => null);
    const parsed = UpdateOrganizationDocumentSchema.safeParse(body);
    if (!parsed.success) {
      return c.json(
        {
          error: "Invalid request body",
          details: parsed.error.flatten().fieldErrors,
        },
        400
      );
    }

    const result = await this.service.updateDocument(
      organizationId,
      documentId,
      userId,
      getActorName(c),
      parsed.data
    );

    if (result === "forbidden") {
      return c.json({ error: "Organization not found or forbidden" }, 403);
    }
    if (result === "not_found") {
      return c.json({ error: "Document not found" }, 404);
    }

    return c.json(result);
  };

  revokeDocument = async (c: Context) => {
    const userId = getRequestUserId(c);
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const organizationId = c.req.param("id");
    const documentId = c.req.param("documentId");
    if (!organizationId || !documentId) {
      return c.json({ error: "Organization id and document id are required" }, 400);
    }

    const result = await this.service.revokeDocument(
      organizationId,
      documentId,
      userId,
      getActorName(c)
    );

    if (result === "forbidden") {
      return c.json({ error: "Organization not found or forbidden" }, 403);
    }
    if (result === "not_found") {
      return c.json({ error: "Document not found" }, 404);
    }

    return c.json({ ok: true });
  };
}
