import type { DocumentDetail, LerEntityType } from "@/types/document.types";

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
  const rows = [
    { label: "ID Dokumen", value: document.id },
    { label: "Kategori", value: document.category ?? "—" },
    { label: "Format", value: document.fileFormat.toUpperCase() },
    { label: "Ukuran", value: formatFileSize(document.fileSizeBytes) },
    { label: "Pemilik", value: document.ownerId },
    { label: "Organisasi", value: document.organizationId ?? "—" },
    { label: "Storage Key", value: document.storageKey },
    { label: "Diunggah", value: formatDate(document.createdAt) },
    { label: "Diperbarui", value: formatDate(document.updatedAt) },
  ];

  return (
    <section className="border-b border-telkom-grey-200 lg:border-b-0 lg:border-r">
      <div className="border-b border-telkom-grey-200 px-4 py-3 md:px-6">
        <h2 className="text-sm font-semibold text-telkom-black">Metadata</h2>
      </div>

      <dl className="divide-y divide-telkom-grey-200">
        {rows.map((row) => (
          <div
            key={row.label}
            className="grid gap-1 px-4 py-3 md:grid-cols-[140px_1fr] md:px-6"
          >
            <dt className="text-xs font-medium text-telkom-grey-500">
              {row.label}
            </dt>
            <dd className="break-all text-sm text-telkom-black">{row.value}</dd>
          </div>
        ))}
      </dl>

      {document.description && (
        <div className="border-t border-telkom-grey-200 px-4 py-4 md:px-6">
          <p className="text-xs font-medium text-telkom-grey-500">Deskripsi</p>
          <p className="mt-2 text-sm leading-relaxed text-telkom-grey-700">
            {document.description}
          </p>
        </div>
      )}

      <div className="border-t border-telkom-grey-200 px-4 py-4 md:px-6">
        <p className="text-xs font-medium text-telkom-grey-500">Preview</p>
        <div className="mt-3 flex h-48 items-center justify-center border border-dashed border-telkom-grey-200 bg-telkom-grey-50">
          <p className="text-sm text-telkom-grey-500">
            Preview {document.fileFormat.toUpperCase()}
          </p>
        </div>
      </div>
    </section>
  );
}

type LerResultsPanelProps = {
  document: DocumentDetail;
};

export function LerResultsPanel({ document }: LerResultsPanelProps) {
  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
        <div>
          <h2 className="text-sm font-semibold text-telkom-black">
            Hasil LER
          </h2>
        </div>

        <LerStatusBadge status={document.lerStatus} />
      </div>

      {document.lerStatus === "pending" && <LerPendingState />}
      {document.lerStatus === "failed" && <LerFailedState />}
      {document.lerStatus === "completed" && (
        <LerEntityTable
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
  const label = {
    pending: "Sedang diproses",
    completed: "Selesai",
    failed: "Gagal",
  }[status];

  return (
    <span className="rounded-sm bg-telkom-grey-100 px-2 py-1 text-xs font-bold text-telkom-grey-700">
      {label}
    </span>
  );
}

function LerPendingState() {
  return (
    <div className="px-4 py-12 text-center md:px-6">
      <p className="text-sm font-medium text-telkom-black">
        Ekstraksi LER sedang berjalan
      </p>
      <p className="mt-2 text-sm text-telkom-grey-600">
        Hasil entitas legal akan muncul otomatis setelah proses selesai.
      </p>
    </div>
  );
}

function LerFailedState() {
  return (
    <div className="px-4 py-12 text-center md:px-6">
      <p className="text-sm font-medium text-telkom-black">
        Ekstraksi LER gagal
      </p>
      <p className="mt-2 text-sm text-telkom-grey-600">
        Dokumen tetap tersimpan. Silakan coba jalankan ulang ekstraksi nanti.
      </p>
    </div>
  );
}

function LerEntityTable({
  entities,
  extractedAt,
}: {
  entities: DocumentDetail["lerEntities"];
  extractedAt: string | null;
}) {
  if (entities.length === 0) {
    return (
      <div className="px-4 py-12 text-center md:px-6">
        <p className="text-sm text-telkom-grey-600">
          Tidak ada entitas legal yang terdeteksi.
        </p>
      </div>
    );
  }

  return (
    <div>
      {extractedAt && (
        <p className="border-b border-telkom-grey-200 px-4 py-2 text-xs text-telkom-grey-500 md:px-6">
          Diekstraksi pada {formatDate(extractedAt)}
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead>
            <tr className="border-b border-telkom-grey-200 bg-telkom-grey-50">
              <th className="px-4 py-2.5 text-xs font-semibold text-telkom-grey-600 md:px-6">
                Tipe Entitas
              </th>
              <th className="px-4 py-2.5 text-xs font-semibold text-telkom-grey-600 md:px-6">
                Nilai
              </th>
              <th className="px-4 py-2.5 text-xs font-semibold text-telkom-grey-600 md:px-6">
                Confidence
              </th>
            </tr>
          </thead>
          <tbody>
            {entities.map((entity) => (
              <tr
                key={entity.id}
                className="border-b border-telkom-grey-200 last:border-b-0"
              >
                <td className="px-4 py-3 md:px-6">
                  <span className="rounded-sm bg-telkom-grey-100 px-1.5 py-0.5 text-xs font-bold text-telkom-grey-700">
                    {entityTypeLabel[entity.entityType]}
                  </span>
                </td>
                <td className="px-4 py-3 text-telkom-black md:px-6">
                  {entity.entityValue}
                </td>
                <td className="px-4 py-3 text-telkom-grey-600 md:px-6">
                  {formatConfidence(entity.confidence)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
