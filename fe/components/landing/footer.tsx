export function Footer() {
  return (
    <footer className="border-t border-telkom-grey-200 bg-white py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 sm:flex-row lg:px-8">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-sm font-semibold text-telkom-black">SMDL</p>
            <p className="text-xs text-telkom-grey-500">
              PT. Telekomunikasi Indonesia Tbk
            </p>
          </div>
        </div>

        <p className="text-xs text-telkom-grey-500">
          &copy; {new Date().getFullYear()} PT. Telekomunikasi Indonesia Tbk.
          Hak cipta dilindungi.
        </p>
      </div>
    </footer>
  );
}
