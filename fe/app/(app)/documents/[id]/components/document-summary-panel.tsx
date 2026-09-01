"use client";

import { useMemo } from "react";
import { Sparkles } from "lucide-react";
import type { DocumentDetail } from "@/types/document.types";
import {
  buildDocumentSummary,
  countFilledFields,
  type SummaryField,
} from "@/lib/document-summary";

type DocumentSummaryPanelProps = {
  document: DocumentDetail;
};

export function DocumentSummaryPanel({ document }: DocumentSummaryPanelProps) {
  const fields = useMemo(() => buildDocumentSummary(document), [document]);
  const filled = countFilledFields(fields);
  const hasLer = document.lerStatus === "completed";

  if (!hasLer) {
    return (
      <div className="flex min-h-[min(40vh,360px)] flex-col items-center justify-center gap-3 px-6 py-16 text-center">
        <Sparkles className="size-8 text-telkom-grey-300" />
        <p className="text-sm text-telkom-grey-500">
          Ringkasan tersedia setelah LER di-generate.
        </p>
      </div>
    );
  }

  return (
    <div className="p-5 md:p-6">
      <p className="mb-4 text-xs text-telkom-grey-500">
        {filled} dari {fields.length} bidang terisi dari hasil LER
      </p>

      <dl className="divide-y divide-telkom-grey-100 rounded-md border border-telkom-grey-100">
        {fields.map((field) => (
          <SummaryRow key={field.key} field={field} />
        ))}
      </dl>
    </div>
  );
}

function SummaryRow({ field }: { field: SummaryField }) {
  return (
    <div className="grid gap-1 px-4 py-3 sm:grid-cols-[220px_minmax(0,1fr)] sm:items-start">
      <dt className="text-sm font-medium text-telkom-grey-600">{field.label}</dt>
      <dd className="text-sm text-telkom-grey-900">
        {field.values.length === 0 ? (
          <span className="text-telkom-grey-400">—</span>
        ) : field.origin === "entity" ? (
          <div className="flex flex-wrap gap-1.5">
            {field.values.map((value) => (
              <span
                key={value}
                className="rounded-md bg-telkom-grey-50 px-2 py-1 text-xs text-telkom-grey-700"
              >
                {value}
              </span>
            ))}
          </div>
        ) : (
          <p className="leading-relaxed text-telkom-grey-700">{field.values[0]}</p>
        )}
      </dd>
    </div>
  );
}
