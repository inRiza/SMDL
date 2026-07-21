type AppHeaderProps = {
  title: string;
  description?: string;
};

export function AppHeader({ title, description }: AppHeaderProps) {
  return (
    <header className="flex h-12 shrink-0 items-center bg-white px-4 md:px-6">
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
