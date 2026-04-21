/**
 * Avatar fallback helpers — single source of truth.
 *
 * Used by SquircleAvatar to render a coloured background + initials when no
 * profile photo is available. The colour is deterministic per user: same
 * UUID (or same name, if UUID isn't available) → same palette slot → same
 * colour everywhere the user appears.
 *
 * DO NOT fork this palette or hash into individual components. If a new
 * rendering context needs fallback colours, import from here.
 */

export const AVATAR_FALLBACK_PALETTE = [
  '#1F3A5F', // deep navy
  '#2E5266', // teal-slate
  '#3D5A3D', // forest
  '#5B4B3A', // warm taupe
  '#6B3838', // rust
  '#5B3A5B', // plum
  '#3A4A6B', // indigo-slate
  '#4A5B3D', // olive
  '#6B4A2E', // cognac
  '#3D4A5B', // steel
  '#5B3D4A', // mulberry
  '#2E4A4A', // pine-teal
] as const;

/**
 * Stable 32-bit hash of a string, folded into a palette slot.
 * Same input → same slot, every time, on every device.
 */
export function getAvatarFallbackColor(
  key: string | null | undefined
): string {
  if (!key) return AVATAR_FALLBACK_PALETTE[0];
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0;
  }
  return AVATAR_FALLBACK_PALETTE[
    Math.abs(hash) % AVATAR_FALLBACK_PALETTE.length
  ];
}

/**
 * Derive 1–2 character initials from a user's display name.
 *
 * Rules:
 * - Two tokens or more → first letter of first two tokens ("Danny Holmes" → "DH")
 * - One token → first two letters ("neilbryan" → "NE")
 * - Single character → that character ("n" → "N")
 * - Empty/nullish → returns empty string (caller should fall back to "?")
 *
 * Numbers and non-letter characters are filtered OUT — "user42" → "US".
 */
export function getInitialsFromName(
  name: string | null | undefined
): string {
  if (!name) return '';
  const cleaned = name.replace(/[^\p{L}\s]/gu, '').trim();
  if (!cleaned) return '';

  const tokens = cleaned.split(/\s+/).filter(Boolean);
  if (tokens.length >= 2) {
    return (tokens[0][0] + tokens[1][0]).toUpperCase();
  }
  return tokens[0].slice(0, 2).toUpperCase();
}
