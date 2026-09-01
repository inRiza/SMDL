import Image from "next/image";
import { cn } from "@/lib/utils";

export const TELKOM_LOGO_COLORED = "/telkom-logo.png";
export const TELKOM_LOGO_WHITE = "/telkom-logo-w.png";

type TelkomLogoProps = {
  onDarkBackground?: boolean;
  size?: number;
  className?: string;
  priority?: boolean;
};

export function TelkomLogo({
  onDarkBackground = false,
  size = 32,
  className,
  priority = false,
}: TelkomLogoProps) {
  const src = onDarkBackground ? TELKOM_LOGO_WHITE : TELKOM_LOGO_COLORED;

  return (
    <Image
      src={src}
      alt="Telkom Indonesia"
      width={size}
      height={size}
      priority={priority}
      className={cn("shrink-0 object-contain", className)}
    />
  );
}

type BrandMarkProps = {
  onDarkBackground?: boolean;
  logoSize?: number;
  className?: string;
  textClassName?: string;
};

export function BrandMark({
  onDarkBackground = false,
  logoSize = 28,
  className,
  textClassName,
}: BrandMarkProps) {
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2.5", className)}>
      <TelkomLogo onDarkBackground={onDarkBackground} size={logoSize} />
      <span
        className={cn(
          "font-heading font-bold tracking-tight",
          onDarkBackground ? "text-white" : "text-telkom-grey-900",
          textClassName,
        )}
      >
        SMDL
      </span>
    </span>
  );
}
