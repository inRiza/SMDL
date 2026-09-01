"use client";

import { useMemo } from "react";
import { ListTree } from "lucide-react";
import type { DocumentDetail } from "@/types/document.types";
import {
  buildStructureNodes,
  countPages,
  hasHeadings,
  type StructureNode,
} from "@/lib/document-structure";
import { cn } from "@/lib/utils";

type DocumentStructurePanelProps = {
  document: DocumentDetail;
};

const LEVEL_STYLES: Record<number, string> = {
  1: "text-lg font-semibold text-telkom-grey-900",
  2: "text-base font-semibold text-telkom-grey-900",
  3: "text-sm font-semibold text-telkom-grey-800",
};

const LEVEL_INDENT: Record<number, string> = {
  1: "pl-0",
  2: "pl-4",
  3: "pl-8",
};

export function DocumentStructurePanel({ document }: DocumentStructurePanelProps) {
  const nodes = useMemo(
    () => buildStructureNodes(document.sections),
    [document.sections],
  );

  if (nodes.length === 0) {
    return (
      <div className="flex min-h-[min(40vh,360px)] flex-col items-center justify-center gap-3 px-6 py-16 text-center">
        <ListTree className="size-8 text-telkom-grey-300" />
        <p className="text-sm text-telkom-grey-500">
          Struktur tersedia setelah LER di-generate.
        </p>
      </div>
    );
  }

  const pageCount = countPages(nodes);
  const headingCount = nodes.filter((node) => node.level > 0).length;

  return (
    <div className="p-5 md:p-6">
      <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-telkom-grey-500">
        <span>{nodes.length} blok</span>
        {headingCount > 0 ? <span>{headingCount} judul</span> : null}
        {pageCount > 0 ? <span>{pageCount} halaman</span> : null}
      </div>

      {!hasHeadings(nodes) ? (
        <p className="mb-4 text-sm text-telkom-grey-500">
          Parser tidak menemukan penanda bab atau pasal, blok ditampilkan berurutan.
        </p>
      ) : null}

      <div className="overflow-hidden rounded-md border border-telkom-grey-100">
        <ol className="divide-y divide-telkom-grey-100">
          {nodes.map((node) => (
            <StructureRow key={node.id} node={node} />
          ))}
        </ol>
      </div>
    </div>
  );
}

function StructureRow({ node }: { node: StructureNode }) {
  const isHeading = node.level > 0;
  const levelKey = Math.min(node.level, 3);

  return (
    <li
      className={cn(
        "px-4 py-3",
        isHeading ? "bg-telkom-grey-50/60" : "bg-white",
      )}
    >
      <div className={cn("flex items-start gap-3", LEVEL_INDENT[levelKey] ?? "pl-8")}>
        <p
          className={cn(
            "min-w-0 flex-1 whitespace-pre-line wrap-break-word",
            isHeading
              ? LEVEL_STYLES[levelKey]
              : "text-sm leading-relaxed text-telkom-grey-600",
          )}
        >
          {node.text}
        </p>
        {node.pageNumber > 0 ? (
          <span className="shrink-0 pt-0.5 text-[11px] tabular-nums text-telkom-grey-400">
            hal. {node.pageNumber}
          </span>
        ) : null}
      </div>
    </li>
  );
}
