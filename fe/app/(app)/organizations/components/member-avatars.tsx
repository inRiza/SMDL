import type { OrganizationMemberPreview } from "@/types/organization.types";
import { cn } from "@/lib/utils";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { getMemberInitials } from "@/lib/member-display";

type MemberAvatarProps = {
  name: string;
  imageUrl?: string | null;
  size?: "sm" | "default" | "lg";
  className?: string;
};

export function MemberAvatar({
  name,
  size = "default",
  className,
}: MemberAvatarProps) {
  return (
    <InitialsAvatar
      name={name}
      kind="user"
      size={size}
      className={className}
    />
  );
}

type StackedMemberAvatarsProps = {
  members: OrganizationMemberPreview[];
  total: number;
  maxVisible?: number;
  size?: "sm" | "md";
};

export function StackedMemberAvatars({
  members,
  total,
  maxVisible = 3,
  size = "sm",
}: StackedMemberAvatarsProps) {
  if (total === 0) return null;

  const visible = members.slice(0, maxVisible);
  const remaining = Math.max(0, total - maxVisible);
  const avatarSize = size === "sm" ? "sm" : "default";

  return (
    <div
      className={cn(
        "flex -space-x-2",
        size === "md" && "[&_[data-initials-avatar]]:size-8",
      )}
    >
      {visible.map((member) => (
        <InitialsAvatar
          key={member.id}
          name={member.name}
          kind="user"
          size={avatarSize}
          className="ring-2 ring-white"
        />
      ))}
      {remaining > 0 && (
        <div
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-full bg-telkom-grey-100 text-[10px] font-medium text-telkom-grey-600 ring-2 ring-white",
            avatarSize === "default" && "size-8 text-xs",
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}

export { getMemberInitials };
