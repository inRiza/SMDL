import { z } from "zod";

const organizationTypes = ["unit_kerja", "divisi", "vendor", "mitra"] as const;
const organizationSorts = ["newest", "oldest", "name_asc", "name_desc"] as const;

export const OrganizationListQuerySchema = z.object({
  q: z.string().trim().optional(),
  type: z.enum(organizationTypes).optional(),
  sort: z.enum(organizationSorts).optional().default("newest"),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(12),
});

export const CreateOrganizationSchema = z.object({
  name: z.string().trim().min(2, "Nama organisasi minimal 2 karakter"),
  description: z.string().trim().optional(),
  type: z.enum(organizationTypes).optional().default("unit_kerja"),
});

const organizationAccessLevels = ["owner", "member", "viewer"] as const;

export const InviteOrganizationMembersSchema = z.object({
  invites: z
    .array(
      z.object({
        email: z.string().trim().email("Email tidak valid"),
        accessLevel: z.enum(organizationAccessLevels).optional().default("member"),
      })
    )
    .min(1, "Minimal satu undangan"),
});

export type OrganizationListQueryInput = z.infer<typeof OrganizationListQuerySchema>;
export type CreateOrganizationInput = z.infer<typeof CreateOrganizationSchema>;
export type InviteOrganizationMembersInput = z.infer<typeof InviteOrganizationMembersSchema>;
