import type { DocumentDetail, LerEntityType } from "@/types/document.types";
import { cn } from "@/lib/utils";

const entityTypeLabel: Record<LerEntityType, string> = {
  PARTY: "Pihak",
  DATE: "Tanggal",
  CONTRACT_NO: "Nomor Kontrak",
  ORG: "Organisasi",
  LOCATION: "Lokasi",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatFileSize(bytes: string) {
  const size = Number(bytes);
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatConfidence(value: number) {
  return `${Math.round(value * 100)}%`;
}

type DocumentMetadataProps = {
  document: DocumentDetail;
};

export function DocumentMetadata({ document }: DocumentMetadataProps) {
  return (
    <section className="rounded-md bg-white p-5 md:p-6">
      <h2 className="text-base font-semibold text-telkom-grey-900">Tentang</h2>
      <p className="mt-0.5 text-sm text-telkom-grey-500">Informasi dokumen</p>

      <dl className="mt-5 space-y-5">
        <MetadataItem label="Format" value={document.fileFormat.toUpperCase()} />
        <MetadataItem label="Ukuran" value={formatFileSize(document.fileSizeBytes)} />
        <MetadataItem label="Kategori" value={document.category ?? "—"} />
        <MetadataItem label="Pemilik" value={document.ownerId} />
        <MetadataItem
          label="Organisasi"
          value={document.organizationId ?? "—"}
        />
        <MetadataItem label="Diunggah" value={formatDate(document.createdAt)} />
        <MetadataItem label="Diperbarui" value={formatDate(document.updatedAt)} />
      </dl>
    </section>
  );
}

function MetadataItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-telkom-grey-500">
        {label}
      </dt>
      <dd className="mt-1.5 break-all text-sm text-telkom-grey-900">{value}</dd>
    </div>
  );
}

type DocumentPreviewProps = {
  document: DocumentDetail;
};

export function DocumentPreview({ document }: DocumentPreviewProps) {
  return (
    <section className="rounded-md bg-white p-5 md:p-6">
      <h2 className="text-base font-semibold text-telkom-grey-900">Preview</h2>
      <p className="mt-0.5 text-sm text-telkom-grey-500">
        Pratinjau dokumen {document.fileFormat.toUpperCase()}
      </p>

      <div className="mt-4 flex h-52 items-center justify-center rounded-md bg-telkom-grey-50">
        <p className="text-sm text-telkom-grey-500">
          Preview {document.fileFormat.toUpperCase()}
        </p>
      </div>
    </section>
  );
}

type LerResultsPanelProps = {
  document: DocumentDetail;
};

export function LerResultsPanel({ document }: LerResultsPanelProps) {
  return (
    <section className="rounded-md bg-white p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-telkom-grey-900">Hasil LER</h2>
          <p className="mt-0.5 text-sm text-telkom-grey-500">
            Entitas legal yang diekstraksi dari dokumen
          </p>
        </div>
        <LerStatusBadge status={document.lerStatus} />
      </div>

      {document.lerStatus === "pending" && <LerPendingState />}
      {document.lerStatus === "failed" && <LerFailedState />}
      {document.lerStatus === "completed" && (
        <LerEntityList
          entities={document.lerEntities}
          extractedAt={document.lerExtractedAt}
        />
      )}
    </section>
  );
}

function LerStatusBadge({
  status,
}: {
  status: DocumentDetail["lerStatus"];
}) {
  const styles = {
    pending: "bg-amber-50 text-amber-700",
    completed: "bg-emerald-50 text-emerald-700",
    failed: "bg-red-50 text-telkom-red",
  };

  const label = {
    pending: "Sedang diproses",
    completed: "Selesai",
    failed: "Gagal",
  }[status];

  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium",
        styles[status]
      )}
    >
      {label}
    </span>
  );
}

function LerPendingState() {
  return (
    <div className="mt-6 rounded-md bg-telkom-grey-50 px-4 py-10 text-center">
      <p className="text-sm font-medium text-telkom-grey-900">
        Ekstraksi LER sedang berjalan
      </p>
      <p className="mt-2 text-sm text-telkom-grey-500">
        Hasil entitas legal akan muncul otomatis setelah proses selesai.
      </p>
    </div>
  );
}

function LerFailedState() {
  return (
    <div className="mt-6 rounded-md bg-telkom-grey-50 px-4 py-10 text-center">
      <p className="text-sm font-medium text-telkom-grey-900">
        Ekstraksi LER gagal
      </p>
      <p className="mt-2 text-sm text-telkom-grey-500">
        Dokumen tetap tersimpan. Silakan coba jalankan ulang ekstraksi nanti.
      </p>
    </div>
  );
}

function LerEntityList({
  entities,
  extractedAt,
}: {
  entities: DocumentDetail["lerEntities"];
  extractedAt: string | null;
}) {
  if (entities.length === 0) {
    return (
      <div className="mt-6 rounded-md bg-telkom-grey-50 px-4 py-10 text-center">
        <p className="text-sm text-telkom-grey-500">
          Tidak ada entitas legal yang terdeteksi.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-5">
      {extractedAt && (
        <p className="mb-3 text-xs text-telkom-grey-500">
          Diekstraksi pada {formatDate(extractedAt)}
        </p>
      )}

      <ul className="space-y-1">
        {entities.map((entity) => (
          <li
            key={entity.id}
            className="flex flex-col gap-2 rounded-md px-3 py-3 transition-colors hover:bg-telkom-grey-50 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0 flex-1">
              <span className="inline-flex rounded-full bg-telkom-grey-100 px-2.5 py-0.5 text-xs font-medium text-telkom-grey-700">
                {entityTypeLabel[entity.entityType]}
              </span>
              <p className="mt-2 text-sm font-medium text-telkom-grey-900">
                {entity.entityValue}
              </p>
            </div>
            <span className="shrink-0 text-sm text-telkom-grey-500">
              {formatConfidence(entity.confidence)} confidence
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
