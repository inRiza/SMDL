import Link from "next/link";

export function Cta() {
  return (
    <section className="bg-telkom-grey-50 py-20 lg:py-24">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-sm bg-telkom-black px-8 py-14 text-center sm:px-16 lg:py-16">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-telkom-red/20" />
          <div className="pointer-events-none absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-white/5" />

          <div className="relative">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Siap mengelola dokumen legal dengan lebih efisien?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-telkom-grey-400">
              Akses platform SMDL untuk mulai mengunggah, mencari, dan
              mengelola dokumen legal perusahaan dengan aman.
            </p>
            <Link
              href="/login"
              className="mt-8 inline-flex items-center justify-center rounded-sm bg-telkom-red px-8 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-telkom-red-dark"
            >
              Masuk ke SMDL
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
