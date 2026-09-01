import { Users } from "lucide-react";
import { getMemberInitials } from "@/lib/member-display";
import { cn } from "@/lib/utils";

type InitialsAvatarProps = {
  name: string;
  kind?: "user" | "organization";
  size?: "sm" | "default" | "lg";
  className?: string;
};

const sizeClasses = {
  sm: "size-6 text-[10px]",
  default: "size-9 text-xs",
  lg: "size-11 text-sm",
};

export function InitialsAvatar({
  name,
  kind = "user",
  size = "default",
  className,
}: InitialsAvatarProps) {
  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center bg-telkom-grey-100 font-semibold text-telkom-grey-700 ring-1 ring-telkom-grey-200",
        kind === "organization" ? "rounded-lg" : "rounded-full",
        sizeClasses[size],
        className,
      )}
      aria-hidden
    >
      {getMemberInitials(name)}
      {kind === "organization" && (
        <span className="absolute -right-1 -bottom-1 flex size-4 items-center justify-center rounded-full bg-white ring-1 ring-telkom-grey-200">
          <Users className="size-2.5 text-telkom-grey-500" />
        </span>
      )}
    </div>
  );
}
