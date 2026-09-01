import { Suspense } from "react";
import { AppShellHeader } from "@/components/app/app-shell-header";
import { AppSidebar } from "@/components/app/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider
      className="h-svh overflow-hidden flex-col bg-telkom-grey-100"
      style={{ "--sidebar-width": "17.5rem" } as Record<string, string>}
    >
      <AppShellHeader />
      <div className="flex min-h-0 flex-1 overflow-hidden bg-telkom-grey-100 pt-14">
        <Suspense fallback={null}>
          <AppSidebar />
        </Suspense>
        <SidebarInset className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-white shadow-none! md:mb-3 md:mr-3 md:rounded-sm">
          {children}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
