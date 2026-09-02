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
  '#3A4654', // slate
  '#3D4A52', // slate-teal
  '#475158', // graphite
  '#4A4F58', // gunmetal
  '#52545C', // ash
  '#3F4A56', // steel
  '#444B54', // dusk
  '#4E5159', // pewter
  '#3D4750', // shadow
  '#48505A', // basalt
  '#414C57', // anthracite
  '#3F4853', // midnight-grey
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
 * - One token → first letter only ("neilbryan" → "N")
 * - Single character → that character ("n" → "N")
 * - Empty/nullish → returns empty string (caller should fall back to "?")
 *
 * Numbers and non-letter characters are filtered OUT — "user42" → "U".
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
  return tokens[0].charAt(0).toUpperCase();
}

/**
 * HUE-DERIVED FALLBACK FILL (BRIEF_DISCOVER_BOARD_AVATARS_AND_RECENT A1.2).
 *
 * AVATAR_FALLBACK_PALETTE above is twelve near-identical desaturated slates —
 * on a dark canvas ten consecutive tiles read as one block of grey. This helper
 * derives only the HUE from the stable user id and fixes saturation/lightness,
 * so every tile carries the same visual weight while the hue actually reads.
 *
 * Keys on the USER ID ALONE — never display name, initials or row position — so
 * a member's colour is identical on the board, in the see-all sheet and across
 * sessions. Additive: existing callers of getAvatarFallbackColor are untouched.
 */
export function stableHue(key: string | null | undefined): number {
  if (!key) return 0;
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 360;
}

export function getAvatarFallbackGradient(userId: string | null | undefined): string {
  const h = stableHue(userId);
  return `linear-gradient(150deg, hsl(${h}, 22%, 30%) 0%, hsl(${h}, 20%, 20%) 100%)`;
}
