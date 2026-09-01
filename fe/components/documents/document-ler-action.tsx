"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLerGeneration } from "@/components/documents/ler-actions";
import type { LerUiStatus } from "@/types/document.types";
import { cn } from "@/lib/utils";

type DocumentLerActionProps = {
  documentId: string;
  documentTitle: string;
  initialStatus: LerUiStatus;
};

export function DocumentLerAction({
  documentId,
  documentTitle,
  initialStatus,
}: DocumentLerActionProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const { status, progress, busy, generate, canGenerate, isProcessing } =
    useLerGeneration({
      documentId,
      initialStatus,
      onComplete: () => router.refresh(),
    });

  async function handleGenerate() {
    setError(null);
    try {
      await generate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memulai LER");
    }
  }

  if (!canGenerate && !isProcessing) return null;

  const label = isProcessing
    ? `Memproses LER ${progress ?? 0}%`
    : status === "failed"
      ? "Coba lagi LER"
      : "Generate LER";

  return (
    <Button
      type="button"
      size="icon-sm"
      variant="ghost"
      className={cn(
        isProcessing
          ? "text-amber-600"
          : status === "failed"
            ? "text-telkom-red hover:bg-telkom-red/5"
            : "text-telkom-grey-600 hover:text-telkom-red"
      )}
      disabled={isProcessing}
      title={error ?? label}
      aria-label={`${label} — ${documentTitle}`}
      onClick={() => void handleGenerate()}
    >
      {isProcessing ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <Sparkles className="size-3.5" />
      )}
    </Button>
  );
}
