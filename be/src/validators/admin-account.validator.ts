import { z } from "zod";
import { ResourceIdSchema } from "./id.validator";

export const AdminAccountUpdateSchema = z.object({
  role: z.enum(["admin", "owner", "viewer", "auditor"]).optional(),
  status: z.enum(["active", "deactivated"]).optional(),
});

export type AdminAccountUpdateInput = z.infer<typeof AdminAccountUpdateSchema>;

export const AdminAccountIdParamSchema = z.object({
  id: ResourceIdSchema,
});
