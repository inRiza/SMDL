export type SystemComponentStatus = "healthy" | "degraded" | "down";

export type SystemComponentHealth = {
  id: string;
  name: string;
  category: "infrastructure" | "api";
  endpoint: string;
  status: SystemComponentStatus;
  latencyMs: number | null;
  message: string;
  checkedAt: string;
};

export type SystemHealthResponse = {
  summary: {
    total: number;
    healthy: number;
    degraded: number;
    down: number;
    checkedAt: string;
  };
  components: SystemComponentHealth[];
};

export const SYSTEM_STATUS_LABELS: Record<SystemComponentStatus, string> = {
  healthy: "Healthy",
  degraded: "Degraded",
  down: "Down",
};
