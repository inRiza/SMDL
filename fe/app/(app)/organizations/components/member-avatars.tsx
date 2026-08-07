import type { OrganizationMemberPreview } from "@/types/organization.types";
import { getMemberAvatarUrl } from "@/lib/member-display";
import { cn } from "@/lib/utils";
import {
  Avatar,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar";

type MemberAvatarProps = {
  name: string;
  imageUrl?: string | null;
  size?: "sm" | "default" | "lg";
  className?: string;
};

export function MemberAvatar({
  name,
  imageUrl,
  size = "default",
  className,
}: MemberAvatarProps) {
  return (
    <Avatar size={size} className={className}>
      <AvatarImage src={getMemberAvatarUrl(name, imageUrl)} alt={name} />
    </Avatar>
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
    <AvatarGroup className={cn(size === "md" && "*:data-[slot=avatar]:size-8")}>
      {visible.map((member) => (
        <Avatar key={member.id} size={avatarSize}>
          <AvatarImage
            src={getMemberAvatarUrl(member.name, member.imageUrl)}
            alt={member.name}
          />
        </Avatar>
      ))}
      {remaining > 0 && (
        <AvatarGroupCount className="text-xs font-medium">
          +{remaining}
        </AvatarGroupCount>
      )}
    </AvatarGroup>
  );
}
