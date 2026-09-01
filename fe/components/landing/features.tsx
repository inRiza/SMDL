import {
  FileText,
  ScanSearch,
  Search,
  Shield,
  MessageSquare,
  Users,
  ClipboardCheck,
  Server,
  type LucideIcon,
} from "lucide-react";
import { ScrollReveal } from "@/components/landing/scroll-reveal";

const features: {
  title: string;
  description: string;
  icon: LucideIcon;
}[] = [
  {
    title: "Manajemen Dokumen Legal",
    description:
      "Unggah, kelola, dan unduh dokumen legal dalam format PDF dan DOCX dengan metadata terstruktur.",
    icon: FileText,
  },
  {
    title: "Legal Entity Recognition",
    description:
      "Ekstraksi otomatis pihak terkait, nomor kontrak, tanggal, dan organisasi setelah dokumen diunggah.",
    icon: ScanSearch,
  },
  {
    title: "Pencarian Dokumen",
    description:
      "Cari dokumen berdasarkan kata kunci, metadata, dan hasil ekstraksi LER dengan filter lanjutan.",
    icon: Search,
  },
  {
    title: "Kontrol Akses (RBAC)",
    description:
      "Manajemen hak akses berbasis peran Administrator, Owner, Viewer, dan Auditor.",
    icon: Shield,
  },
  {
    title: "TELLS",
    description:
      "Asisten AI untuk pencarian semantik, ringkasan dokumen, dan tanya jawab natural language.",
    icon: MessageSquare,
  },
  {
    title: "Manajemen Organisasi",
    description:
      "Buat tim dan organisasi, undang anggota, dan bagikan dokumen dalam ruang kerja bersama.",
    icon: Users,
  },
  {
    title: "Audit & Monitoring",
    description:
      "Log audit immutable untuk setiap aktivitas sensitif — login, CRUD dokumen, dan perubahan akses.",
    icon: ClipboardCheck,
  },
  {
    title: "Keamanan Data",
    description:
      "Seluruh pemrosesan LER (Docling + IndoBERT) berjalan on-premise tanpa data ke pihak ketiga.",
    icon: Server,
  },
];

function FeatureCard({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <div className="feature-bracket-card-light group rounded-xl border border-telkom-grey-100 bg-white transition-colors hover:border-telkom-grey-200 hover:shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
      <div className="feature-icon-box-light">
        <Icon size={20} strokeWidth={1.5} className="text-telkom-red" />
      </div>

      <h3 className="mt-6 font-heading text-base font-semibold text-telkom-grey-900">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-telkom-grey-500">
        {description}
      </p>
    </div>
  );
}

export function Features() {
  return (
    <section id="fitur" className="relative bg-white py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <ScrollReveal>
          <h2 className="max-w-xl font-heading text-3xl font-bold tracking-tight text-telkom-grey-900 sm:text-4xl">
            Satu platform.
            <br />
            Semua kebutuhan dokumen legal.
          </h2>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-telkom-grey-500">
            Platform terintegrasi untuk manajemen, ekstraksi metadata, dan
            keamanan dokumen legal perusahaan — berjalan sepenuhnya on-premise.
          </p>
        </ScrollReveal>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <ScrollReveal key={feature.title} delay={i * 50}>
              <FeatureCard {...feature} />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
