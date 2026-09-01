import { ScrollReveal } from "@/components/landing/scroll-reveal";

const highlights = [
  { label: "Format Didukung", value: "PDF, DOCX" },
  { label: "Peran Pengguna", value: "4 Role RBAC" },
  { label: "Komunikasi", value: "HTTPS / TLS" },
  { label: "Infrastruktur AI", value: "On-Premise" },
];

const steps = [
  {
    step: "01",
    title: "Unggah Dokumen",
    description: "Upload PDF atau DOCX ke workspace personal atau organisasi.",
  },
  {
    step: "02",
    title: "Ekstraksi Otomatis",
    description: "LER mengekstrak entitas legal dan metadata secara real-time.",
  },
  {
    step: "03",
    title: "Kelola & Audit",
    description: "Cari, bagikan, dan lacak setiap perubahan dengan audit log.",
  },
];

export function About() {
  return (
    <section id="tentang" className="relative py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="grid items-start gap-16 lg:grid-cols-2">
          <ScrollReveal direction="left">
            <span className="landing-label">Tentang SMDL</span>
            <h2 className="mt-4 font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Infrastruktur legal digital untuk Telkom
            </h2>
            <p className="mt-5 text-base leading-relaxed text-white/55">
              SMDL dirancang khusus untuk PT. Telekomunikasi Indonesia Tbk
              sebagai platform terpusat pengelolaan dokumen legal perusahaan.
            </p>
            <p className="mt-4 text-base leading-relaxed text-white/55">
              Setiap dokumen terhubung dengan metadata, pemilik, organisasi,
              dan hasil ekstraksi LER — memastikan informasi legal selalu mudah
              ditemukan, terlindungi, dan dapat diaudit.
            </p>

            <div className="mt-10 grid grid-cols-2 gap-3">
              {highlights.map((item) => (
                <div key={item.label} className="landing-card !p-4">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-white/35">
                    {item.label}
                  </p>
                  <p className="mt-1 font-heading text-lg font-bold text-white">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </ScrollReveal>

          <ScrollReveal direction="right" delay={120}>
            <div className="space-y-4">
              {steps.map((s) => (
                <div
                  key={s.step}
                  className="landing-card flex gap-5 !p-5 transition-transform duration-300 hover:translate-x-1"
                >
                  <span className="font-heading text-3xl font-bold text-telkom-red/40">
                    {s.step}
                  </span>
                  <div>
                    <h3 className="font-heading text-base font-semibold text-white">
                      {s.title}
                    </h3>
                    <p className="mt-1 text-sm text-white/50">{s.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
