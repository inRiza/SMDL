import { AppHeader } from "@/components/app/app-header";

type AdminPageShellProps = {
  title: string;
  description: string;
};

export function AdminPageShell({ title, description }: AdminPageShellProps) {
  return (
    <>
      <AppHeader title={title} description={description} />
      <div className="flex flex-1 flex-col items-center justify-center p-8">
        <div className="max-w-md rounded-sm border border-dashed border-telkom-grey-200 bg-telkom-grey-50 p-10 text-center">
          <p className="text-xs font-semibold text-telkom-red">Segera Hadir</p>
          <h2 className="mt-2 text-lg font-bold text-telkom-grey-900">{title}</h2>
          <p className="mt-3 text-sm leading-relaxed text-telkom-grey-500">
            {description}
          </p>
        </div>
      </div>
    </>
  );
}
