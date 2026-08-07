"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BookOpen,
  ChevronDown,
  FileText,
  MessageSquare,
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
import { cn } from "@/lib/utils";

const navItemClass =
  "!h-11 rounded-xl px-3.5 text-[15px] font-medium gap-3 [&_svg]:size-[18px] transition-colors hover:bg-telkom-black/4 data-active:bg-telkom-black/4 data-active:font-semibold data-active:text-telkom-black";

const childItemClass =
  "relative z-[1] flex h-8 items-center rounded-md px-2 text-[13px] text-telkom-grey-700 transition-colors hover:bg-telkom-black/4";

export function AppSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isOrgSection =
    pathname === "/organizations" || pathname.startsWith("/organizations/");
  const [orgOpen, setOrgOpen] = useState(isOrgSection);
  const mineActive = searchParams.get("mine") === "1";

  useEffect(() => {
    if (isOrgSection) setOrgOpen(true);
  }, [isOrgSection]);

  const isWikiActive =
    pathname === "/wiki" || pathname.startsWith("/documents/");
  const isTellsActive = pathname === "/tells" || pathname.startsWith("/tells/");

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
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={<Link href="/wiki" />}
                  isActive={isWikiActive}
                  tooltip="Wiki"
                  size="lg"
                  className={navItemClass}
                >
                  <BookOpen />
                  <span>Wiki</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  render={<Link href="/documents" />}
                  isActive={pathname === "/documents"}
                  tooltip="Dokumen"
                  size="lg"
                  className={navItemClass}
                >
                  <FileText />
                  <span>Dokumen</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  type="button"
                  isActive={isOrgSection}
                  tooltip="Organisasi"
                  size="lg"
                  className={navItemClass}
                  onClick={() => setOrgOpen((prev) => !prev)}
                >
                  <Users />
                  <span className="flex-1 text-left">Organisasi</span>
                  <ChevronDown
                    className={cn(
                      "ml-auto size-4 opacity-70 transition-transform",
                      orgOpen && "rotate-180"
                    )}
                  />
                </SidebarMenuButton>

                {orgOpen && (
                  <ul className="relative mt-1 ml-5 space-y-0.5 border-l border-telkom-grey-200 py-0.5 pl-3 group-data-[collapsible=icon]:hidden">
                    <li className="relative">
                      <span
                        aria-hidden
                        className="pointer-events-none absolute top-1/2 left-0 h-px w-3 -translate-x-full -translate-y-1/2 bg-telkom-grey-200"
                      />
                      <Link
                        href="/organizations"
                        className={cn(
                          childItemClass,
                          pathname === "/organizations" &&
                            !mineActive &&
                            "bg-telkom-black/4 font-semibold text-telkom-black"
                        )}
                      >
                        Kumpulan Organisasi
                      </Link>
                    </li>
                    <li className="relative">
                      <span
                        aria-hidden
                        className="pointer-events-none absolute top-1/2 left-0 h-px w-3 -translate-x-full -translate-y-1/2 bg-telkom-grey-200"
                      />
                      <Link
                        href="/organizations?mine=1"
                        className={cn(
                          childItemClass,
                          pathname === "/organizations" &&
                            mineActive &&
                            "bg-telkom-black/4 font-semibold text-telkom-black"
                        )}
                      >
                        Organisasi Saya
                      </Link>
                    </li>
                  </ul>
                )}
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  render={<Link href="/tells" />}
                  isActive={isTellsActive}
                  tooltip="TELLS"
                  size="lg"
                  className={navItemClass}
                >
                  <MessageSquare />
                  <span>TELLS</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail className="after:hidden hover:after:hidden" />
    </Sidebar>
  );
}
