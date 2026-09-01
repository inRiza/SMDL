import { BrandMark } from "@/components/brand/telkom-logo";

export function Footer() {
  return (
    <footer className="border-t border-telkom-grey-100 bg-white py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row lg:px-8">
        <BrandMark logoSize={24} textClassName="text-sm" />
        <p className="text-xs text-telkom-grey-500">
          &copy; {new Date().getFullYear()} PT. Telekomunikasi Indonesia Tbk.
        </p>
      </div>
    </footer>
  );
}
