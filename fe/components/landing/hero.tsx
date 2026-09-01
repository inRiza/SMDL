import { LandingButton } from "@/components/landing/landing-buttons";

export function Hero() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white">
      <div className="relative z-10 mx-auto max-w-4xl px-6 py-32 text-center lg:px-8 lg:py-40">
        <h1 className="hero-animate hero-animate-1 font-heading text-4xl font-bold leading-[1.1] tracking-tight text-telkom-grey-900 sm:text-5xl lg:text-6xl xl:text-[4rem]">
          Sistem Manajemen Dokumen Legal
        </h1>

        <p className="hero-animate hero-animate-2 mx-auto mt-6 max-w-2xl text-base leading-relaxed text-telkom-grey-600 sm:text-lg">
          Platform terpusat untuk penyimpanan, pencarian, dan pengelolaan
          dokumen legal dengan ekstraksi metadata otomatis melalui Legal Entity
          Recognition dan kontrol akses berbasis peran.
        </p>

        <div className="hero-animate hero-animate-3 mt-10 flex justify-center">
          <LandingButton href="/login" variant="primary">
            Mulai Sekarang
          </LandingButton>
        </div>
      </div>
    </section>
  );
}
