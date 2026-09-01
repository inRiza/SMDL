import type { ReactNode } from "react";

function MockWindow({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="landing-mock overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c0c]/80 shadow-[0_24px_80px_rgba(0,0,0,0.5)] backdrop-blur-sm">
      <div className="flex items-center gap-2 border-b border-white/6 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="ml-2 text-[11px] font-medium text-white/35">{title}</span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export function LerMockPanel() {
  const entities = [
    { type: "PARTY", value: "PT Telkom Indonesia Tbk", color: "bg-blue-500/20 text-blue-300" },
    { type: "CONTRACT_NO", value: "TELKOM/LEGAL/2025/001", color: "bg-emerald-500/20 text-emerald-300" },
    { type: "DATE", value: "15 Januari 2025", color: "bg-amber-500/20 text-amber-300" },
    { type: "LOCATION", value: "Jakarta Selatan", color: "bg-red-500/20 text-red-300" },
  ];

  return (
    <MockWindow title="LER — Ekstraksi Entitas">
      <div className="space-y-2">
        <div className="flex items-center gap-2 rounded-lg bg-white/4 px-3 py-2">
          <div className="h-1.5 w-1.5 rounded-full bg-telkom-red" />
          <span className="text-[11px] text-white/50">Memproses dokumen...</span>
        </div>
        {entities.map((e) => (
          <div
            key={e.type}
            className="flex items-center justify-between rounded-lg border border-white/6 bg-white/3 px-3 py-2.5"
          >
            <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${e.color}`}>
              {e.type}
            </span>
            <span className="text-xs text-white/70">{e.value}</span>
          </div>
        ))}
      </div>
    </MockWindow>
  );
}

export function DocMockPanel() {
  const docs = [
    { name: "Perjanjian Kerja Sama 2025.pdf", status: "Ready", date: "12 Mar" },
    { name: "Addendum NDA Vendor.docx", status: "Processing", date: "10 Mar" },
    { name: "Kontrak Pengadaan Q1.pdf", status: "Ready", date: "8 Mar" },
  ];

  return (
    <MockWindow title="Dokumen Legal">
      <div className="space-y-2">
        {docs.map((doc) => (
          <div
            key={doc.name}
            className="flex items-center gap-3 rounded-lg border border-white/6 bg-white/3 px-3 py-2.5"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-telkom-red/15">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4 text-telkom-red">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-white/80">{doc.name}</p>
              <p className="text-[10px] text-white/35">{doc.date}</p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                doc.status === "Ready"
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-amber-500/15 text-amber-400"
              }`}
            >
              {doc.status}
            </span>
          </div>
        ))}
      </div>
    </MockWindow>
  );
}

export function TellsMockPanel() {
  return (
    <MockWindow title="TELLS — Asisten AI">
      <div className="space-y-3">
        <div className="flex justify-end">
          <div className="max-w-[80%] rounded-xl rounded-tr-sm bg-telkom-red/20 px-3 py-2 text-xs text-white/80">
            Ringkas klausul pembayaran dalam kontrak ini
          </div>
        </div>
        <div className="flex justify-start">
          <div className="max-w-[85%] rounded-xl rounded-tl-sm border border-white/8 bg-white/4 px-3 py-2 text-xs leading-relaxed text-white/65">
            Klausul pembayaran: Pihak Kedua wajib melakukan pembayaran dalam 30 hari setelah invoice diterima...
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-white/8 bg-white/3 px-3 py-2">
          <span className="text-[11px] text-white/30">Tanyakan sesuatu...</span>
        </div>
      </div>
    </MockWindow>
  );
}

export function SecurityMockPanel() {
  const items = [
    { label: "Autentikasi", ok: true },
    { label: "RBAC Check", ok: true },
    { label: "TLS 1.3", ok: true },
    { label: "Audit Log", ok: true },
  ];

  return (
    <MockWindow title="Keamanan Sistem">
      <div className="grid grid-cols-2 gap-2">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-2 rounded-lg border border-white/6 bg-white/3 px-3 py-2.5"
          >
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-3 w-3 text-emerald-400">
                <path d="M5 12l5 5L20 7" />
              </svg>
            </div>
            <span className="text-xs text-white/60">{item.label}</span>
          </div>
        ))}
      </div>
    </MockWindow>
  );
}
