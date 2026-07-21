const securityPoints = [
  "Autentikasi wajib sebelum mengakses sumber daya apapun",
  "RBAC diterapkan pada setiap permintaan dokumen dan layanan",
  "Komunikasi client-server melalui HTTPS/TLS terenkripsi",
  "Validasi file upload dari format, ukuran, dan integritas",
  "LER dan SLM berjalan sepenuhnya di infrastruktur internal",
  "Log audit immutable yang tidak dapat dimodifikasi pengguna biasa",
];

export function Security() {
  return (
    <section id="keamanan" className="border-y border-telkom-grey-200 bg-white py-20 lg:py-28">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="text-sm font-semibold uppercase text-telkom-red">
              Keamanan & Kepatuhan
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-telkom-black sm:text-4xl">
              Keamanan informasi sebagai prioritas utama
            </h2>
            <p className="mt-5 text-base leading-relaxed text-telkom-grey-600">
              Mengikuti standar OWASP ASVS dan Telkom Access Control Standard,
              SMDL menempatkan kontrol akses dan keamanan informasi sebagai
              fondasi arsitektur sistem.
            </p>
          </div>

          <ul className="space-y-4">
            {securityPoints.map((point) => (
              <li key={point} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-telkom-red/10">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className="h-3 w-3 text-telkom-red"
                  >
                    <path d="M5 12l5 5L20 7" />
                  </svg>
                </span>
                <span className="text-sm leading-relaxed text-telkom-grey-600">
                  {point}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
