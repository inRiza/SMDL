export function About() {
  return (
    <section id="tentang" className="bg-white py-20 lg:py-28">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="text-sm font-semibold uppercase text-telkom-red">
              Tentang SMDL
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-telkom-black sm:text-4xl">
              Infrastruktur legal digital untuk Telkom
            </h2>
            <p className="mt-5 text-base leading-relaxed text-telkom-grey-600">
              SMDL (Sistem Manajemen Dokumen Legal) dirancang khusus untuk
              PT. Telekomunikasi Indonesia Tbk sebagai platform terpusat
              pengelolaan dokumen legal perusahaan.
            </p>
            <p className="mt-4 text-base leading-relaxed text-telkom-grey-600">
              Setiap dokumen terhubung dengan metadata, pemilik, organisasi, dan
              hasil ekstraksi LER memastikan informasi legal selalu mudah
              ditemukan, terlindungi, dan dapat diaudit.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Format Didukung", value: "PDF, DOCX" },
              { label: "Peran Pengguna", value: "4 Role RBAC" },
              { label: "Komunikasi", value: "HTTPS / TLS" },
              { label: "Infrastruktur AI", value: "On-Premise" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-sm border border-telkom-grey-200 bg-telkom-grey-50 p-5"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-telkom-grey-500">
                  {item.label}
                </p>
                <p className="mt-2 text-lg font-bold text-telkom-black">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
