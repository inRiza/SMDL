export type ResolvedLerStatus = "idle" | "pending" | "completed" | "failed";

export function resolveLerStatus(
  status: string,
  lerExtractedAt: Date | string | null | undefined
): ResolvedLerStatus {
  if (status === "processing") return "pending";
  if (status === "ler_failed") return "failed";
  if (lerExtractedAt) return "completed";
  return "idle";
}
