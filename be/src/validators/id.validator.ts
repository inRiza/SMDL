import { z } from "zod";

/** UUID-shaped id; accepts legacy seed ids that fail strict RFC version checks. */
export const ResourceIdSchema = z
  .string()
  .regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    "Invalid id format"
  );

export const OptionalResourceIdSchema = ResourceIdSchema.optional();
