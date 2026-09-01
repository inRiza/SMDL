"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Server,
  UserCog,
  Users,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { sidebarNavButtonClass } from "@/lib/sidebar-nav";

const adminNav: {
  href: string;
  label: string;
  icon: typeof Home;
  exact?: boolean;
}[] = [
  { href: "/admin", label: "Overview", icon: Home, exact: true },
  { href: "/admin/users", label: "User", icon: Users },
  { href: "/admin/accounts", label: "Account Management", icon: UserCog },
  { href: "/admin/system", label: "System Management", icon: Server },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar
      variant="inset"
      collapsible="icon"
      className="top-14 h-[calc(100svh-3.5rem)] border-0 [&_[data-slot=sidebar-container]]:border-0 [&_[data-slot=sidebar-inner]]:bg-transparent [&_[data-slot=sidebar-inner]]:shadow-none"
    >
      <SidebarContent className="px-3 py-5">
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {adminNav.map((item) => {
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={isActive}
                      tooltip={item.label}
                      className={sidebarNavButtonClass}
                    >
                      <Icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail className="after:hidden hover:after:hidden" />
    </Sidebar>
  );
}
