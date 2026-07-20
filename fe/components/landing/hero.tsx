import Link from "next/link";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-white pt-28 pb-20 lg:pt-36 lg:pb-28">
      <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-telkom-red/5" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-telkom-grey-100" />

      <div className="relative mx-auto max-w-6xl px-6 lg:px-8">
        <div className="max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 bg-telkom-grey-50 px-4 py-1.5">
            {/* <span className="h-1.5 w-1.5 rounded-full bg-telkom-red" /> */}
            <span className="text-xs font-medium text-telkom-grey-600">
              PT. Telekomunikasi Indonesia Tbk
            </span>
          </div>

          <h1 className="text-4xl font-bold leading-tight tracking-tight text-telkom-black sm:text-5xl lg:text-[3.25rem] lg:leading-[1.15]">
            Sistem Manajemen{" "}
            <span className="text-telkom-red">Dokumen Legal</span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-telkom-grey-600">
            Platform terpusat untuk penyimpanan, pencarian, dan pengelolaan
            dokumen legal dengan ekstraksi metadata otomatis melalui Legal
            Entity Recognition dan kontrol akses berbasis peran.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-sm bg-telkom-red px-8 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-telkom-red-dark"
            >
              Mulai Sekarang
            </Link>
            <a
              href="#fitur"
              className="inline-flex items-center justify-center rounded-sm border border-telkom-grey-200 bg-white px-8 py-3.5 text-sm font-semibold text-telkom-black transition-colors hover:border-telkom-grey-400 hover:bg-telkom-grey-50"
            >
              Lihat Fitur
            </a>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-2 gap-6 border-t border-telkom-grey-200 pt-10 sm:grid-cols-4">
          {[
            { value: "LER", label: "Ekstraksi Otomatis" },
            { value: "RBAC", label: "Kontrol Akses" },
            { value: "TELLS", label: "Asisten AI" },
            { value: "100%", label: "On-Premise" },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-2xl font-bold text-telkom-red">{stat.value}</p>
              <p className="mt-1 text-sm text-telkom-grey-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
