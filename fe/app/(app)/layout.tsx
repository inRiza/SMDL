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
      <div className="flex flex-1 pt-14">
        <AppSidebar />
        <SidebarInset className="bg-white">{children}</SidebarInset>
      </div>
    </SidebarProvider>
  );
}
