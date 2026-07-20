type PagePlaceholderProps = {
  title: string;
  description: string;
};

export function PagePlaceholder({ title, description }: PagePlaceholderProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8">
      <div className="max-w-md rounded-lg border border-dashed border-telkom-grey-200 bg-telkom-grey-50 p-10 text-center">
        <p className="text-xs font-semibold text-telkom-red">
          Segera Hadir
        </p>
        <h2 className="mt-2 text-xl font-bold text-telkom-black">{title}</h2>
        <p className="mt-3 text-sm leading-relaxed text-telkom-grey-600">
          {description}
        </p>
      </div>
    </div>
  );
}
