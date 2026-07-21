const features = [
  {
    title: "Manajemen Dokumen Legal",
    description:
      "Unggah, kelola, dan unduh dokumen legal dalam format PDF dan DOCX dengan metadata terstruktur dan pelacakan versi.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
      </svg>
    ),
  },
  {
    title: "Legal Entity Recognition",
    description:
      "Ekstraksi otomatis entitas legal pihak terkait, nomor kontrak, tanggal, dan organisasi langsung setelah dokumen diunggah.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      </svg>
    ),
  },
  {
    title: "Pencarian Dokumen",
    description:
      "Cari dokumen berdasarkan kata kunci, metadata, dan hasil ekstraksi LER dengan filter untuk mempersempit hasil.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-3-3" />
      </svg>
    ),
  },
  {
    title: "Kontrol Akses (RBAC)",
    description:
      "Manajemen hak akses berbasis peran Administrator, Owner, Viewer, dan Auditor dengan prinsip least-privilege.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
  },
  {
    title: "TELLS (Asisten Inteligensi)",
    description:
      "Asisten berbasis SLM untuk pencarian semantik, ringkasan dokumen, dan tanya jawab natural language dalam bahasa Indonesia.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    title: "Manajemen Organisasi",
    description:
      "Buat tim dan organisasi, undang anggota, kelola tingkat akses, dan bagikan dokumen dalam ruang kerja bersama.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    title: "Audit & Monitoring",
    description:
      "Log audit immutable untuk setiap aktivitas sensitif login, CRUD dokumen, perubahan akses, dan penggunaan TELLS.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    title: "Keamanan Data",
    description:
      "Seluruh pemrosesan LER dan SLM berjalan on-premise. Tidak ada data dokumen yang dikirim ke layanan pihak ketiga.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
        <path d="M7 10l3 3 5-6" />
      </svg>
    ),
  },
];

export function Features() {
  return (
    <section id="fitur" className="bg-telkom-grey-50 py-20 lg:py-28">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase text-telkom-red">
            Fitur Utama
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-telkom-black sm:text-4xl">
            Solusi lengkap manajemen dokumen legal
          </h2>
          <p className="mt-4 text-base leading-relaxed text-telkom-grey-600">
            SMDL menggantikan sistem SharePoint/Wiki legacy dengan platform
            terintegrasi yang aman, terstruktur, dan didukung kecerdasan buatan
            on-premise.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-sm border border-telkom-grey-200 bg-white p-6 transition-shadow hover:shadow-md"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-sm bg-telkom-red/10 text-telkom-red transition-colors group-hover:bg-telkom-red group-hover:text-white">
                {feature.icon}
              </div>
              <h3 className="mt-5 text-base font-semibold text-telkom-black">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-telkom-grey-500">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
