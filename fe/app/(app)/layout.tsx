import { AppShellHeader } from "@/components/app/app-shell-header";
import { AppSidebar } from "@/components/app/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider className="min-h-svh flex-col">
      <AppShellHeader />
      <div className="flex min-h-0 flex-1 overflow-hidden pt-14">
        <AppSidebar />
        <SidebarInset className="min-h-0 flex-1 overflow-hidden bg-white">
          {children}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
