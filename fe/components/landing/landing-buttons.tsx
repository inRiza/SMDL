import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type LandingButtonProps = {
  href: string;
  children: ReactNode;
  className?: string;
  variant?: "hero-secondary" | "primary";
  onClick?: () => void;
};

export function LandingButton({
  href,
  children,
  className,
  variant = "primary",
  onClick,
}: LandingButtonProps) {
  const isAnchor = href.startsWith("#");

  const classes = cn(
    "inline-flex items-center justify-center rounded-lg px-8 py-3.5 text-sm font-semibold transition-all duration-300",
    variant === "hero-secondary" && "btn-hero-secondary",
    variant === "primary" && "btn-landing-primary",
    className
  );

  if (isAnchor) {
    return (
      <a href={href} className={classes} onClick={onClick}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={classes} onClick={onClick}>
      {children}
    </Link>
  );
}
