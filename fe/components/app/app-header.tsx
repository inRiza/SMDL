import { SidebarTrigger } from "@/components/ui/sidebar";

type AppHeaderProps = {
  title: string;
  description?: string;
};

export function AppHeader({ title, description }: AppHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 bg-white px-4">
      <SidebarTrigger className="-ml-1" />
      <div className="min-w-0">
        <h1 className="truncate text-sm font-semibold text-telkom-black">
          {title}
        </h1>
        {description && (
          <p className="truncate text-xs text-muted-foreground">{description}</p>
        )}
      </div>
    </header>
  );
}
