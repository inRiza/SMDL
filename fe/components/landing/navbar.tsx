"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const navLinks = [
  { href: "#fitur", label: "Fitur" },
  { href: "#tentang", label: "Tentang" },
  { href: "#keamanan", label: "Keamanan" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white py-5 shadow-[0_1px_0_0_rgba(0,0,0,0.06)]"
          : "bg-transparent py-3"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-telkom-red">
            <span className="text-sm font-bold text-white">T</span>
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold tracking-tight text-telkom-black">
              SMDL
            </p>
            <p className="text-[10px] font-medium text-telkom-grey-500">
              PT Telkom Indonesia
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-telkom-grey-600 transition-colors hover:text-telkom-red"
            >
              {link.label}
            </a>
          ))}
          <Link
            href="/login"
            className="rounded-sm bg-telkom-red px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-telkom-red-dark"
          >
            Masuk
          </Link>
        </nav>

        <button
          type="button"
          aria-label="Buka menu"
          className="flex h-10 w-10 items-center justify-center rounded-sm border border-telkom-grey-200 md:hidden"
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-telkom-black"
          >
            {menuOpen ? (
              <path d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-telkom-grey-200 bg-white px-6 py-4 md:hidden">
          <nav className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="py-2 text-sm font-medium text-telkom-grey-600"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/login"
              className="mt-2 rounded-sm bg-telkom-red px-5 py-2.5 text-center text-sm font-semibold text-white"
              onClick={() => setMenuOpen(false)}
            >
              Masuk
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
