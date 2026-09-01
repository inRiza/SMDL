import { ScrollReveal } from "@/components/landing/scroll-reveal";

const securityPoints = [
  {
    title: "Autentikasi Wajib",
    description: "Setiap akses sumber daya memerlukan autentikasi terlebih dahulu.",
  },
  {
    title: "RBAC Terintegrasi",
    description: "Kontrol akses berbasis peran pada setiap permintaan dokumen.",
  },
  {
    title: "Enkripsi TLS",
    description: "Komunikasi client-server melalui HTTPS/TLS terenkripsi.",
  },
  {
    title: "Validasi Upload",
    description: "Validasi format, ukuran, dan integritas file saat unggah.",
  },
  {
    title: "AI On-Premise",
    description: "LER (Docling + IndoBERT) berjalan di infrastruktur internal Telkom.",
  },
  {
    title: "Audit Immutable",
    description: "Log audit yang tidak dapat dimodifikasi pengguna biasa.",
  },
];

export function Security() {
  return (
    <section id="keamanan" className="relative py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <ScrollReveal className="mx-auto max-w-2xl text-center">
          <span className="landing-label">Keamanan & Kepatuhan</span>
          <h2 className="mt-4 font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Enterprise-grade security
          </h2>
          <p className="mt-4 text-base leading-relaxed text-white/55">
            Mengikuti standar OWASP ASVS dan Telkom Access Control Standard.
          </p>
        </ScrollReveal>

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {securityPoints.map((point, i) => (
            <ScrollReveal key={point.title} delay={i * 70}>
              <div className="landing-card group h-full transition-transform duration-300 hover:-translate-y-1">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-telkom-red/15 transition-colors group-hover:bg-telkom-red/25">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className="h-4 w-4 text-telkom-red"
                  >
                    <path d="M5 12l5 5L20 7" />
                  </svg>
                </div>
                <h3 className="mt-4 font-heading text-sm font-semibold text-white">
                  {point.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-white/50">
                  {point.description}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
