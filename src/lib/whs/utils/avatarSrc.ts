/**
 * Pick the best avatar source from a friend-shaped record.
 * Tier 1: WHS thumbnail (England Golf — primary)
 * Tier 2: Clbhouz profile photo (user_profiles.profile_photo_url)
 * Tier 3: null (caller renders initials block)
 */
export function pickAvatarSrc(
  whsThumb: string | null | undefined,
  clbhouzPhoto: string | null | undefined,
): string | null {
  if (whsThumb) return whsThumb;
  if (clbhouzPhoto) return clbhouzPhoto;
  return null;
}
