"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  fetchDocumentLerStatus,
  generateDocumentLer,
} from "@/lib/api/document/route";
import type { LerUiStatus } from "@/types/document.types";
import { cn } from "@/lib/utils";

export const LER_STATUS_LABELS: Record<LerUiStatus, string> = {
  idle: "Belum LER",
  pending: "Memproses",
  completed: "Selesai",
  failed: "Gagal",
};

export const LER_STATUS_STYLES: Record<LerUiStatus, string> = {
  idle: "bg-telkom-grey-100 text-telkom-grey-700",
  pending: "bg-amber-50 text-amber-700",
  completed: "bg-emerald-50 text-emerald-700",
  failed: "bg-red-50 text-red-700",
};

const ENTITY_TYPE_LABELS: Record<string, string> = {
  PARTY: "Pihak",
  ORG: "Organisasi",
  DATE: "Tanggal",
  CONTRACT_NO: "No. Kontrak",
  LOCATION: "Lokasi",
};

export function labelForEntityType(type: string) {
  return ENTITY_TYPE_LABELS[type] ?? type;
}

type UseLerGenerationOptions = {
  documentId: string;
  initialStatus: LerUiStatus;
  onComplete?: () => void;
};

const POLL_INTERVAL_MS = 2000;

export function useLerGeneration({
  documentId,
  initialStatus,
  onComplete,
}: UseLerGenerationOptions) {
  const [status, setStatus] = useState<LerUiStatus>(initialStatus);
  const [progress, setProgress] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // server-rendered status only wins while nothing is running locally
  useEffect(() => {
    setStatus((current) => (current === "pending" ? current : initialStatus));
  }, [initialStatus]);

  // polling survives page reloads and proxy/connection drops, unlike SSE
  useEffect(() => {
    if (status !== "pending") return;

    let active = true;
    let timer: ReturnType<typeof setTimeout>;

    async function poll() {
      try {
        const latest = await fetchDocumentLerStatus(documentId);
        if (!active) return;

        if (latest.progress) {
          setProgress(latest.progress.progress);
          setMessage(latest.progress.message);
        }

        if (latest.lerStatus !== "pending") {
          setStatus(latest.lerStatus);
          setProgress(null);
          setMessage(null);
          setBusy(false);
          onCompleteRef.current?.();
          return;
        }
      } catch {
        /* transient failure, keep polling */
      }

      if (active) timer = setTimeout(poll, POLL_INTERVAL_MS);
    }

    timer = setTimeout(poll, POLL_INTERVAL_MS);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [documentId, status]);

  const generate = useCallback(async () => {
    if (busy || status === "pending") return;

    setBusy(true);
    setProgress(5);
    setMessage("Memulai ekstraksi LER…");

    try {
      await generateDocumentLer(documentId);
      setStatus("pending");
    } catch (error) {
      setBusy(false);
      setProgress(null);
      setMessage(null);
      throw error;
    }
  }, [busy, documentId, status]);

  return {
    status,
    progress,
    message,
    busy,
    generate,
    canGenerate: status === "idle" || status === "failed",
    isProcessing: status === "pending" || busy,
  };
}

type LerStatusBadgeProps = {
  status: LerUiStatus;
  className?: string;
};

export function LerStatusBadge({ status, className }: LerStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm px-2 py-0.5 text-[11px] font-medium",
        LER_STATUS_STYLES[status],
        className
      )}
    >
      {LER_STATUS_LABELS[status]}
    </span>
  );
}

type LerGenerateButtonProps = {
  status: LerUiStatus;
  busy?: boolean;
  progress?: number | null;
  compact?: boolean;
  onGenerate: () => void;
  className?: string;
};

export function LerGenerateButton({
  status,
  busy = false,
  progress = null,
  compact = false,
  onGenerate,
  className,
}: LerGenerateButtonProps) {
  const isProcessing = status === "pending" || busy;
  const canGenerate = status === "idle" || status === "failed";

  if (!canGenerate && !isProcessing) return null;

  return (
    <Button
      type="button"
      size={compact ? "sm" : "default"}
      variant={status === "failed" ? "outline" : "default"}
      className={cn(
        "gap-1.5",
        status !== "failed" && "bg-telkom-red hover:bg-telkom-red/90",
        className
      )}
      disabled={isProcessing}
      onClick={onGenerate}
    >
      {isProcessing ? (
        <>
          <Loader2 className="size-3.5 animate-spin" />
          {compact ? `${progress ?? 0}%` : `Memproses LER… ${progress ?? 0}%`}
        </>
      ) : (
        <>
          <Sparkles className="size-3.5" />
          {status === "failed" ? "Coba lagi LER" : "Generate LER"}
        </>
      )}
    </Button>
  );
}
