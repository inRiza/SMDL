import { z } from "zod";
import { ResourceIdSchema } from "./id.validator";

export const AdminUserListQuerySchema = z.object({
  q: z.string().trim().optional(),
  role: z.enum(["admin", "owner", "viewer", "auditor"]).optional(),
  status: z.enum(["active", "deactivated", "deleted"]).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  sort: z
    .enum(["name_asc", "name_desc", "logs_desc", "failed_desc", "activity_desc"])
    .optional()
    .default("name_asc"),
});

export type AdminUserListQuery = z.infer<typeof AdminUserListQuerySchema>;

export const AdminUserIdParamSchema = z.object({
  id: ResourceIdSchema,
});
