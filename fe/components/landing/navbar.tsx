"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BrandMark } from "@/components/brand/telkom-logo";
import { LandingButton } from "@/components/landing/landing-buttons";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed z-50 w-full transition-all duration-500 ease-out",
        scrolled ? "top-3 px-3 sm:top-4 sm:px-4" : "top-0 px-0",
      )}
    >
      <div
        className={cn(
          "mx-auto flex items-center justify-between transition-all duration-500 ease-out",
          scrolled
            ? "max-w-3xl rounded-2xl border border-telkom-grey-200 bg-white/95 px-4 py-2 shadow-[0_8px_32px_rgba(15,23,42,0.08)] backdrop-blur-xl"
            : "max-w-6xl bg-transparent px-6 py-4 lg:px-8",
        )}
      >
        <Link href="/" className="transition-opacity hover:opacity-80">
          <BrandMark logoSize={28} textClassName="text-sm sm:text-base" />
        </Link>

        <LandingButton
          href="/login"
          variant="primary"
          className={cn(
            "transition-all duration-500",
            scrolled ? "px-4! py-2! text-xs" : "px-5! py-2.5! text-sm",
          )}
        >
          Masuk
        </LandingButton>
      </div>
    </header>
  );
}
