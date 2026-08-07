type MemberNameSource = {
  email: string;
  user?: { name: string } | null;
};

export function getMemberDisplayName(member: MemberNameSource) {
  const name = member.user?.name?.trim();
  if (name) return name;
  const local = member.email.split("@")[0];
  return local || member.email;
}

export function getMemberInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 1).toUpperCase();
  return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
}
