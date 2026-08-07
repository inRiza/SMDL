import { z } from "zod";

export const UserListQuerySchema = z.object({
  q: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(8),
});

export type UserListQueryInput = z.infer<typeof UserListQuerySchema>;
