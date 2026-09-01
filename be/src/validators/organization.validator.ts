import { z } from "zod";

const organizationTypes = ["unit_kerja", "divisi", "vendor", "mitra"] as const;
const organizationSorts = ["newest", "oldest", "name_asc", "name_desc"] as const;
const organizationAccessLevels = ["owner", "member", "viewer"] as const;
const fileFormats = ["pdf", "docx"] as const;

export const OrganizationListQuerySchema = z.object({
  q: z.string().trim().optional(),
  type: z.enum(organizationTypes).optional(),
  sort: z.enum(organizationSorts).optional().default("newest"),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(12),
  mine: z
    .union([z.literal("1"), z.literal("true"), z.literal("0"), z.literal("false")])
    .optional()
    .transform((value) => value === "1" || value === "true"),
});

export const CreateOrganizationSchema = z.object({
  name: z.string().trim().min(2, "Nama organisasi minimal 2 karakter"),
  description: z.string().trim().optional(),
  type: z.enum(organizationTypes).optional().default("unit_kerja"),
});

export const UpdateOrganizationSchema = z.object({
  name: z.string().trim().min(2, "Nama organisasi minimal 2 karakter").optional(),
  description: z.string().trim().nullable().optional(),
  type: z.enum(organizationTypes).optional(),
});

export const InviteOrganizationMembersSchema = z.object({
  invites: z
    .array(
      z.object({
        email: z.string().trim().email("Email tidak valid"),
        userId: z.string().uuid().optional(),
        name: z.string().trim().optional(),
        accessLevel: z.enum(organizationAccessLevels).optional().default("member"),
      })
    )
    .min(1, "Minimal satu undangan"),
});

export const UpdateMemberAccessSchema = z.object({
  accessLevel: z.enum(["member", "viewer"]),
});

export const TransferOwnershipSchema = z.object({
  newOwnerMemberId: z.string().uuid("Pilih anggota pengganti owner"),
  demotedAccessLevel: z.enum(["member", "viewer"]).default("member"),
});

export const CreateOrganizationDocumentSchema = z.object({
  title: z.string().trim().min(2, "Nama dokumen minimal 2 karakter"),
  description: z.string().trim().optional(),
  category: z.string().trim().optional(),
  fileFormat: z.enum(fileFormats).default("pdf"),
  fileSizeBytes: z.coerce.number().int().min(1).optional().default(1024),
  visibility: z.enum(["public", "organization"]),
});

export const UpdateOrganizationDocumentSchema = z.object({
  title: z.string().trim().min(2).optional(),
  description: z.string().trim().nullable().optional(),
  category: z.string().trim().nullable().optional(),
});

export type OrganizationListQueryInput = z.infer<typeof OrganizationListQuerySchema>;
export type CreateOrganizationInput = z.infer<typeof CreateOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof UpdateOrganizationSchema>;
export type InviteOrganizationMembersInput = z.infer<typeof InviteOrganizationMembersSchema>;
export type UpdateMemberAccessInput = z.infer<typeof UpdateMemberAccessSchema>;
export type TransferOwnershipInput = z.infer<typeof TransferOwnershipSchema>;
export type CreateOrganizationDocumentInput = z.infer<typeof CreateOrganizationDocumentSchema>;
export type CreateOrganizationDocumentWithFile = CreateOrganizationDocumentInput & {
  fileBuffer: Buffer;
  fileName: string;
  fileSizeBytes: number;
};
export type UpdateOrganizationDocumentInput = z.infer<typeof UpdateOrganizationDocumentSchema>;
