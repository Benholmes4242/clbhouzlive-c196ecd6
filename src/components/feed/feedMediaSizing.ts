/**
 * Feed media sizing has one owner: ordinary posts and media-first reviews
 * use the same intrinsic ratio and viewport cap; words-first review frames
 * retain their independent whole-card fit rule.
 */
export const RATIO_MIN = 0.8;   // tallest allowed = 4:5 (portrait capped)
export const RATIO_MAX = 1.91;  // widest = ~cinematic landscape
export const FALLBACK_RATIO = 4 / 5;

// Chrome measured on a 390x844 card: header 54.7 + caption 49.2 + unified
// band incl. actions 100.2 + hairline + 88 nav = 293, reserved at 305
// (12px margin). This is still a typed reserve and is a known debt for the
// normal-post path, now also shared by media-first reviews. Words-first
// reviews size themselves from REVIEW_CARD_MAX_HEIGHT in reviewPostCard.ts
// and their media frame fills what is left.
export const MEDIA_CHROME_RESERVE = 305;
export const mediaMaxHeight = () =>
  `max(280px, calc(100svh - ${MEDIA_CHROME_RESERVE}px - env(safe-area-inset-bottom)))`;

export function clampFeedMediaRatio(media?: { width?: number | null; height?: number | null } | null): number {
  if (!media || !media.width || !media.height) return FALLBACK_RATIO;
  const r = media.width / media.height;
  return Math.min(RATIO_MAX, Math.max(RATIO_MIN, r));
}