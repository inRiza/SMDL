import { cn } from "@/lib/utils";

export const sidebarNavButtonClass = cn(
  "rounded-sm text-[15px] font-medium transition-colors",
  "gap-3 [&_svg]:size-[18px]",
  "hover:bg-telkom-black/4",
  "data-active:bg-telkom-black/4 data-active:font-semibold data-active:text-telkom-black",
  "group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2!",
  "[&_span]:truncate [&_span]:group-data-[collapsible=icon]:hidden",
);

export const sidebarChildLinkClass = cn(
  "relative z-[1] flex h-8 items-center rounded-sm px-2 text-[13px] text-telkom-grey-700 transition-colors hover:bg-telkom-black/4",
);
