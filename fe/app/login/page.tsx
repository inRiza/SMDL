import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-white px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-telkom-red">
            <span className="text-lg font-bold text-white">T</span>
          </div>
          <h1 className="mt-4 text-2xl font-bold text-telkom-black">SMDL</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            PT. Telekomunikasi Indonesia Tbk
          </p>
        </div>

        <div className="rounded-lg border border-telkom-grey-200 bg-telkom-grey-50 p-8 text-center">
          <p className="text-sm font-medium text-telkom-black">
            Halaman Login
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Form autentikasi akan ditambahkan di sini.
          </p>
          <Link
            href="/wiki"
            className="mt-6 inline-flex h-9 w-full items-center justify-center rounded-lg bg-telkom-red text-sm font-medium text-white transition-colors hover:bg-telkom-red-dark"
          >
            Masuk (Demo)
          </Link>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link href="/" className="hover:text-telkom-red">
            Kembali ke landing page
          </Link>
        </p>
      </div>
    </div>
  );
}
