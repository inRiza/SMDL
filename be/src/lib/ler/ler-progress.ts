export type LerStage =
  | "queued"
  | "parsing"
  | "extracting_text"
  | "running_ocr"
  | "running_ler"
  | "saving"
  | "done"
  | "failed";

export type LerProgress = {
  documentId: string;
  stage: LerStage;
  progress: number;
  message: string;
  updatedAt: string;
};

const progressStore = new Map<string, LerProgress>();
const listeners = new Map<string, Set<(progress: LerProgress) => void>>();

export function setLerProgress(
  documentId: string,
  update: Partial<Omit<LerProgress, "documentId" | "updatedAt">> & {
    stage: LerStage;
    message: string;
  }
) {
  const current = progressStore.get(documentId);
  const next: LerProgress = {
    documentId,
    stage: update.stage,
    progress: update.progress ?? current?.progress ?? 0,
    message: update.message,
    updatedAt: new Date().toISOString(),
  };
  progressStore.set(documentId, next);
  listeners.get(documentId)?.forEach((listener) => listener(next));
  return next;
}

export function getLerProgress(documentId: string): LerProgress | null {
  return progressStore.get(documentId) ?? null;
}

export function subscribeLerProgress(
  documentId: string,
  listener: (progress: LerProgress) => void
) {
  const set = listeners.get(documentId) ?? new Set();
  set.add(listener);
  listeners.set(documentId, set);

  const current = progressStore.get(documentId);
  if (current) listener(current);

  return () => {
    set.delete(listener);
    if (set.size === 0) listeners.delete(documentId);
  };
}

export function clearLerProgress(documentId: string) {
  progressStore.delete(documentId);
  listeners.delete(documentId);
}
