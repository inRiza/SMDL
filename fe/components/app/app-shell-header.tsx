import Link from "next/link";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function AppShellHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center gap-3 border-b border-telkom-grey-200 bg-white px-4">
      <SidebarTrigger className="-ml-1 shrink-0" />

      <Link href="/wiki" className="flex min-w-0 items-center gap-3">
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-bold text-telkom-black">SMDL</p>
          <p className="truncate text-[10px] text-telkom-grey-500">
            PT Telkom Indonesia
          </p>
        </div>
      </Link>
    </header>
  );
}
