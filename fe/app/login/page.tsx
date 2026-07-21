"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { loginRequest } from "@/lib/api/auth/route";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await loginRequest(email, password);
      const next = searchParams.get("next") ?? "/wiki";
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-sm border border-telkom-grey-200 bg-telkom-grey-50 p-6"
    >
      <div>
        <label className="mb-1 block text-xs font-medium text-telkom-grey-600">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="h-10 w-full rounded-sm border border-telkom-grey-200 bg-white px-3 text-sm outline-none focus:bg-telkom-grey-100"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-telkom-grey-600">
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          className="h-10 w-full rounded-sm border border-telkom-grey-200 bg-white px-3 text-sm outline-none focus:bg-telkom-grey-100"
        />
      </div>

      {error && <p className="text-xs text-telkom-red">{error}</p>}

      <Button
        type="submit"
        disabled={loading}
        className="h-10 w-full cursor-pointer bg-telkom-red hover:bg-telkom-red-dark"
      >
        {loading ? "Memproses..." : "Masuk"}
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-white px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          {/* <div className="flex size-12 items-center justify-center rounded-sm bg-telkom-red">
            <span className="text-lg font-bold text-white">T</span>
          </div> */}
          <h1 className="mt-4 text-2xl font-bold text-telkom-black">SMDL</h1>
          <p className="mt-1 text-sm text-telkom-grey-500">PT Telkom Indonesia</p>
        </div>

        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>

        <p className="mt-6 text-center text-xs text-telkom-grey-500">
          <Link href="/" className="hover:text-telkom-red">
            Kembali ke landing page
          </Link>
        </p>
      </div>
    </div>
  );
}
