"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { fetchMe, logoutRequest } from "@/lib/api/auth/route";
import type { AuthUser } from "@/types/auth.types";

export function AppShellHeader() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    fetchMe()
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  async function handleLogout() {
    await logoutRequest();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between bg-telkom-red px-4 text-white">
      <div className="flex min-w-0 items-center gap-3">
        <SidebarTrigger className="-ml-1 shrink-0" />

        <Link href="/wiki" className="min-w-0 leading-tight">
          <p className="truncate text-sm font-bold">SMDL</p>
          <p className="truncate text-[10px]">
            PT Telkom Indonesia
          </p>
        </Link>
      </div>

      {user && (
        <div className="flex shrink-0 items-center gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="max-w-35 truncate text-xs font-semibold sm:max-w-50">
              {user.email}
            </span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-sm px-2.5 py-1.5 text-xs cursor-pointer hover:bg-red-800"
          >
            <LogOut className="size-3.5" />
            Keluar
          </button>
        </div>
      )}
    </header>
  );
}
