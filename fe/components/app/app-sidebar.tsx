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
import { sidebarChildLinkClass, sidebarNavButtonClass } from "@/lib/sidebar-nav";
import { cn } from "@/lib/utils";

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

  const isDocumentDetail =
    /^\/documents\/[^/]+$/.test(pathname) && pathname !== "/documents/activity";
  const isDocumentsActive =
    pathname === "/documents" || pathname === "/documents/activity";
  const isWikiActive = pathname === "/wiki" || isDocumentDetail;
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
                  className={sidebarNavButtonClass}
                >
                  <BookOpen />
                  <span>Wiki</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  render={<Link href="/documents" />}
                  isActive={isDocumentsActive}
                  tooltip="Dokumen"
                  className={sidebarNavButtonClass}
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
                  className={sidebarNavButtonClass}
                  onClick={() => setOrgOpen((prev) => !prev)}
                >
                  <Users />
                  <span className="flex-1 text-left">Organisasi</span>
                  <ChevronDown
                    className={cn(
                      "ml-auto size-4 opacity-70 transition-transform group-data-[collapsible=icon]:hidden",
                      orgOpen && "rotate-180",
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
                          sidebarChildLinkClass,
                          pathname === "/organizations" &&
                            !mineActive &&
                            "bg-telkom-black/4 font-semibold text-telkom-black",
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
                          sidebarChildLinkClass,
                          pathname === "/organizations" &&
                            mineActive &&
                            "bg-telkom-black/4 font-semibold text-telkom-black",
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
                  className={sidebarNavButtonClass}
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
