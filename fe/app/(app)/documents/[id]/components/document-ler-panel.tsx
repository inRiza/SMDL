"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DocumentDetail, LerEntity } from "@/types/document.types";
import { fetchMe } from "@/lib/api/auth/route";
import {
  LerStatusBadge,
  labelForEntityType,
  useLerGeneration,
} from "@/components/documents/ler-actions";
import { cn } from "@/lib/utils";

type DocumentLerPanelProps = {
  document: DocumentDetail;
};

export function DocumentLerPanel({ document }: DocumentLerPanelProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    void fetchMe().then((user) => {
      setIsOwner(Boolean(user && user.id === document.ownerId));
    });
  }, [document.ownerId]);

  const { status, progress, message, busy, generate, canGenerate, isProcessing } =
    useLerGeneration({
      documentId: document.id,
      initialStatus: document.lerStatus,
      onComplete: () => router.refresh(),
    });

  const entities = document.lerEntities;

  async function handleGenerate() {
    setError(null);
    try {
      await generate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memulai LER");
    }
  }

  return (
    <div className="p-5 md:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <LerStatusBadge status={status} />
          {document.lerExtractedAt && status === "completed" ? (
            <span className="text-xs text-telkom-grey-500">
              {formatDateTime(document.lerExtractedAt)}
            </span>
          ) : null}
          {isProcessing && message ? (
            <span className="text-xs text-telkom-grey-500">
              {message} {progress != null ? `(${progress}%)` : ""}
            </span>
          ) : null}
        </div>

        {isOwner && (canGenerate || isProcessing) ? (
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
            title={
              isProcessing
                ? `Memproses ${progress ?? 0}%`
                : status === "failed"
                  ? "Coba lagi LER"
                  : "Generate LER"
            }
            aria-label="Generate LER"
            onClick={() => void handleGenerate()}
          >
            {isProcessing ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Sparkles className="size-3.5" />
            )}
          </Button>
        ) : null}
      </div>

      {error ? <p className="mt-3 text-sm text-telkom-red">{error}</p> : null}

      {status === "failed" && !isProcessing && !error ? (
        <p className="mt-3 text-sm text-telkom-grey-500">
          Ekstraksi gagal. Coba lagi dari icon di atas.
        </p>
      ) : null}

      {status === "completed" && entities.length === 0 ? (
        <p className="mt-3 text-sm text-telkom-grey-500">
          Tidak ada entitas terdeteksi.
        </p>
      ) : null}

      {entities.length > 0 ? (
        <div className="mt-4 overflow-hidden rounded-md border border-telkom-grey-100">
          <div className="border-b border-telkom-grey-100 bg-telkom-grey-50 px-4 py-2 text-xs font-medium text-telkom-grey-600">
            {entities.length} entitas
          </div>
          <ul className="divide-y divide-telkom-grey-100">
            {entities.map((entity) => (
              <EntityRow key={entity.id} entity={entity} />
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function EntityRow({ entity }: { entity: LerEntity }) {
  const confidence = Math.round(entity.confidence * 100);

  return (
    <li className="grid gap-2 px-4 py-3 sm:grid-cols-[140px_minmax(0,1fr)_72px] sm:items-center">
      <span className="text-xs font-medium uppercase tracking-wide text-telkom-grey-500">
        {labelForEntityType(entity.entityType)}
      </span>
      <span className="text-sm text-telkom-grey-900">{entity.entityValue}</span>
      <span className="text-xs text-telkom-grey-500 sm:text-right">{confidence}%</span>
    </li>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
