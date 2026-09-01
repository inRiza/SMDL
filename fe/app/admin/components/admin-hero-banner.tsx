import { cn } from "@/lib/utils";

type AdminHeroStat = {
  label: string;
  value: string | number;
  valueClassName?: string;
};

type AdminHeroBannerProps = {
  eyebrow: string;
  title: string;
  description?: string;
  stats: AdminHeroStat[];
  loading?: boolean;
};

export function AdminHeroBanner({
  eyebrow,
  title,
  description,
  stats,
  loading = false,
}: AdminHeroBannerProps) {
  return (
    <section
      className="relative z-0 shrink-0 overflow-hidden px-4 pb-8 pt-6 md:px-6 md:pb-10 md:pt-8"
      style={{
        background: "linear-gradient(135deg, #dc2626 0%, #c62828 45%, #7f1d1d 100%)",
      }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.12]" aria-hidden>
        <svg className="h-full w-full" viewBox="0 0 800 200" preserveAspectRatio="none">
          <path
            d="M0,120 C200,40 400,180 600,80 C700,40 750,60 800,40 L800,0 L0,0 Z"
            fill="white"
          />
        </svg>
      </div>

      <div className="relative z-10">
        <p className="text-xs font-medium uppercase tracking-wider text-white/70">{eyebrow}</p>
        <h1 className="mt-1 text-xl font-bold text-white md:text-2xl">{title}</h1>
        {description ? (
          <p className="mt-1 max-w-lg text-sm text-white/80">{description}</p>
        ) : null}

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {stats.map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-white/20 bg-white px-4 py-4 shadow-md shadow-black/10"
            >
              <p
                className={cn(
                  "text-2xl font-bold tracking-tight text-telkom-black md:text-3xl",
                  item.valueClassName
                )}
              >
                {loading ? "—" : typeof item.value === "number"
                  ? item.value.toLocaleString("id-ID")
                  : item.value}
              </p>
              <p className="mt-1 text-xs font-medium text-telkom-grey-500">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
