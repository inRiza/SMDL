export function getMemberInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 1).toUpperCase();
  return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
}

export function getDefaultAvatarUrl(seed: string) {
  return `https://api.dicebear.com/9.x/notionists/png?seed=${encodeURIComponent(seed)}&size=128`;
}

export function getMemberAvatarUrl(name: string, imageUrl?: string | null) {
  if (imageUrl) return imageUrl;
  return getDefaultAvatarUrl(name);
}
