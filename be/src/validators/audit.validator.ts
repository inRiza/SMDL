import { z } from "zod";
import { OptionalResourceIdSchema, ResourceIdSchema } from "./id.validator";

export const AuditListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  eventType: z.string().min(1).optional(),
  userId: OptionalResourceIdSchema,
  status: z.enum(["success", "failure"]).optional(),
  q: z.string().min(1).max(200).optional(),
});

export type AuditListQuery = z.infer<typeof AuditListQuerySchema>;

export const AuditIdParamSchema = z.object({
  id: ResourceIdSchema,
});
