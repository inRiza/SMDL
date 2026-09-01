import { enqueueLerExtraction, ensureLerWorker, runLerExtractionInline } from "@/workers/ler.worker";

export async function triggerLerExtraction(documentId: string) {
  try {
    ensureLerWorker();
    await enqueueLerExtraction(documentId);
  } catch (error) {
    console.warn("[ler] queue unavailable, running inline", error);
    void runLerExtractionInline(documentId).catch((err) => {
      console.error("[ler] inline extraction failed", err);
    });
  }
}
