"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, Eye, EyeOff } from "lucide-react";
import { Suspense, useState } from "react";
import { BrandMark } from "@/components/brand/telkom-logo";
import { loginRequest, logoutRequest } from "@/lib/api/auth/route";
import { cn } from "@/lib/utils";

type LoginMode = "user" | "admin";

const inputClass = "h-11 w-full rounded-sm border border-telkom-grey-200 bg-telkom-grey-50/4 px-3.5 text-sm text-telkom-grey-900 outline-none transition-colors placeholder:text-telkom-grey-400";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<LoginMode>("user");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await loginRequest(email, password);

      if (mode === "admin" && result.user.role !== "admin") {
        await logoutRequest();
        throw new Error("Akun ini tidak memiliki akses administrator.");
      }

      if (mode === "user" && result.user.role === "admin") {
        await logoutRequest();
        throw new Error(
          "Akun administrator hanya dapat masuk melalui tab Admin."
        );
      }

      const fallback = mode === "admin" ? "/admin" : "/wiki";
      const next = searchParams.get("next") ?? fallback;
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-1 rounded-sm bg-telkom-grey-100 p-1">
        <button
          type="button"
          onClick={() => setMode("user")}
          className={cn(
            "flex items-center justify-center gap-2 rounded-sm px-3 py-2 text-sm font-medium transition-colors",
            mode === "user"
              ? "bg-white text-telkom-grey-900 shadow-sm"
              : "text-telkom-grey-500 hover:text-telkom-grey-700",
          )}
        >
          Pengguna
        </button>
        <button
          type="button"
          onClick={() => setMode("admin")}
          className={cn(
            "flex items-center justify-center gap-2 rounded-sm px-3 py-2 text-sm font-medium transition-colors",
            mode === "admin"
              ? "bg-white text-telkom-grey-900 shadow-sm"
              : "text-telkom-grey-500 hover:text-telkom-grey-700",
          )}
        >
          Admin
        </button>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-medium text-telkom-grey-700">
          Email<span className="text-telkom-red">*</span>
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          placeholder="nama@telkom.co.id"
          className={inputClass}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-medium text-telkom-grey-700">
          Password<span className="text-telkom-red">*</span>
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className={cn(inputClass, "pr-10")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute top-1/2 right-1 flex size-8 -translate-y-1/2 items-center justify-center rounded-sm text-telkom-grey-400 transition-colors hover:text-telkom-grey-600"
            aria-label={
              showPassword ? "Sembunyikan password" : "Tampilkan password"
            }
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-sm border border-telkom-red/20 bg-telkom-red/5 px-3 py-2.5 text-sm text-telkom-red">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="h-11 w-full rounded-sm bg-telkom-red text-sm font-semibold text-white transition-colors hover:bg-telkom-red-dark disabled:cursor-not-allowed disabled:opacity-55"
      >
        {loading ? "Memproses..." : "Masuk"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-telkom-grey-50 p-4 sm:p-6">
      <div className="flex min-h-[560px] w-full max-w-5xl overflow-hidden rounded-sm border border-telkom-grey-200 bg-white shadow-[0_16px_48px_rgba(15,23,42,0.06)]">
        <aside className="relative hidden w-[44%] flex-col justify-between bg-telkom-red lg:flex">
          <div className="p-8">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-white/70 transition-colors hover:text-white"
            >
              <ChevronLeft className="size-4" />
              Kembali
            </Link>
          </div>

          <div className="p-8 pb-10">
            <BrandMark onDarkBackground logoSize={36} textClassName="text-xl" />
            <h2 className="mt-8 font-heading text-3xl font-bold leading-tight text-white">
              Sistem Manajemen
              <br />
              Dokumen Legal
            </h2>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/75">
              Platform terpusat untuk manajemen dokumen, audit aktivitas, dan
              keamanan informasi perusahaan.
            </p>
          </div>
        </aside>

        <div className="flex flex-1 flex-col justify-center px-6 py-10 sm:px-10 lg:px-12">
          <div className="mx-auto w-full max-w-sm">
            <div className="mb-8 text-center lg:hidden">
              <Link href="/" className="inline-block transition-opacity hover:opacity-80">
                <BrandMark logoSize={32} />
              </Link>
            </div>

            <div className="mb-8 text-center lg:text-left">
              <div className="hidden lg:block">
                <BrandMark logoSize={32} />
              </div>
              <h1 className="mt-6 font-heading text-2xl font-bold tracking-tight text-telkom-grey-900">
                Masuk ke SMDL
              </h1>
              <p className="mt-2 text-sm text-telkom-grey-500">
                Pilih tipe akun lalu masukkan kredensial Anda
              </p>
            </div>

            <Suspense fallback={null}>
              <LoginForm />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
