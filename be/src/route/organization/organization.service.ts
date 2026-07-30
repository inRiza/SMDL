import type {
  OrganizationDetail,
  OrganizationListResponse,
} from "@/types/organization.types";
import type {
  CreateOrganizationInput,
  InviteOrganizationMembersInput,
  OrganizationListQueryInput,
} from "@/validators/organization.validator";
import { OrganizationRepository } from "./organization.repository";

export class OrganizationService {
  constructor(
    private readonly repository: OrganizationRepository = new OrganizationRepository()
  ) {}

  async listOrganizations(
    query: OrganizationListQueryInput
  ): Promise<OrganizationListResponse> {
    const { rows, total } = await this.repository.findMany(query);

    return {
      data: rows.map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        type: row.type,
        ownerId: row.ownerId,
        documentCount: row._count.documents,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      })),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async getOrganization(id: string): Promise<OrganizationDetail | null> {
    const row = await this.repository.findById(id);
    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      description: row.description,
      type: row.type,
      ownerId: row.ownerId,
      ownerEmail: row.owner.email,
      documentCount: row._count.documents,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async createOrganization(
    input: CreateOrganizationInput,
    ownerId: string,
    ownerEmail: string
  ) {
    const row = await this.repository.create(input, ownerId, ownerEmail);

    return {
      id: row.id,
      name: row.name,
      description: row.description,
      type: row.type,
      ownerId: row.ownerId,
      documentCount: row._count.documents,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async inviteMembers(
    organizationId: string,
    ownerId: string,
    input: InviteOrganizationMembersInput
  ) {
    const organization = await this.repository.findOwnedOrganization(
      organizationId,
      ownerId
    );

    if (!organization) {
      return null;
    }

    const invites = await this.repository.createInvites(
      organizationId,
      ownerId,
      input.invites
    );

    return { data: invites };
  }
}
