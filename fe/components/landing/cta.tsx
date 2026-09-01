import { LandingButton } from "@/components/landing/landing-buttons";
import { ScrollReveal } from "@/components/landing/scroll-reveal";

export function Cta() {
  return (
    <section className="relative py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <ScrollReveal direction="scale">
          <div className="landing-card relative overflow-hidden px-8 py-16 text-center sm:px-16 lg:py-20">
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(185,28,28,0.12)_0%,transparent_70%)]"
              aria-hidden
            />

            <div className="relative">
              <h2 className="font-heading text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
                Siap mengelola dokumen legal dengan lebih efisien?
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-base text-white/55">
                Akses platform SMDL untuk mulai mengunggah, mencari, dan
                mengelola dokumen legal perusahaan dengan aman.
              </p>
              <LandingButton href="/login" variant="primary" className="mt-8">
                Masuk ke SMDL
              </LandingButton>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
