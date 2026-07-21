"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  FileText,
  LogOut,
  MessageSquare,
  Settings,
  User,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

const mainNav = [
  { title: "Wiki", href: "/wiki", icon: BookOpen },
  { title: "Dokumen", href: "/documents", icon: FileText },
  { title: "Organisasi", href: "/organizations", icon: Users },
  { title: "TELLS", href: "/tells", icon: MessageSquare },
];

const navItemClass = "!h-9 -mr-2 w-[calc(100%+0.5rem)] pr-3 data-active:bg-telkom-grey-100 data-active:font-semibold data-active:text-telkom-black data-active:shadow-none";

export function AppSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/wiki") return pathname === "/wiki";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <Sidebar
      collapsible="icon"
      className="top-14 h-[calc(100svh-3.5rem)] border-r border-telkom-grey-200 [&_[data-slot=sidebar-inner]]:bg-white [&_[data-slot=sidebar-inner]]:text-telkom-black"
    >
      <SidebarContent className="pt-2">
        <SidebarGroup className="px-2 py-0">
          <SidebarGroupLabel className="px-2 text-telkom-grey-500">
            Menu Utama
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    render={<Link href={item.href} />}
                    isActive={isActive(item.href)}
                    tooltip={item.title}
                    className={navItemClass}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-telkom-grey-200 px-2 py-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link href="/profile" />}
              isActive={isActive("/profile")}
              tooltip="Profil"
              className={navItemClass}
            >
              <User />
              <span>Profil</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link href="/profile" />}
              tooltip="Pengaturan"
              className={cn(navItemClass, "data-active:border-r-0")}
            >
              <Settings />
              <span>Pengaturan</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link href="/login" />}
              tooltip="Keluar"
              className={cn(navItemClass, "data-active:border-r-0")}
            >
              <LogOut />
              <span>Keluar</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
