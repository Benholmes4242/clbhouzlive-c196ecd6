/**
 * Pure rules for the Clubhouse feed's review post (BRIEF_REVIEW_POST_REBUILD).
 * Kept free of React so the tests can hold each rule directly.
 */
import { CHROME_CLEARANCE } from '@/lib/chromeClearance';
import { NAV_CLEARANCE } from '@/lib/navClearance';

/**
 * R.1 — THE CARD FITS BETWEEN THE ISLANDS.
 *
 * THE PATTERN, written down because this card is the first surface to do it:
 * a surface that must fit whole between the top islands and the bottom pill
 * sizes itself from the two MEASURED clearances, never from a typed number.
 * CHROME_CLEARANCE reads `--chrome-clearance` (published by ChromeIsland) and
 * NAV_CLEARANCE composes `--nav-pill-h` (published by GlobalBottomNavigation).
 * Both already include their own safe-area inset, so nothing here adds
 * env(safe-area-inset-*) again. The 16px is the card's own 8px margin above
 * and below. Inside, exactly ONE child flexes (the media frame); every other
 * child is flex:none, so the fixed content keeps its height and the media
 * absorbs whatever is left, floored at 120px and capped at 1:1.
 *
 * There is no `--nav-clearance` custom property in the app: NAV_CLEARANCE is
 * the composed token, so it is consumed directly.
 */
export const REVIEW_CARD_MAX_HEIGHT = `calc(100dvh - ${CHROME_CLEARANCE} - ${NAV_CLEARANCE} - 16px)`;

/** F.1 — the media floor. Below it the card overflows the gap (F.4). */
export const REVIEW_MEDIA_MIN_HEIGHT = 120;

/** A.3 — join whichever clauses are true; separators go with their clause. */
export function joinClauses(parts: Array<string | null | undefined | false>): string {
  return parts.filter((p): p is string => typeof p === 'string' && p.trim().length > 0).join(' \u00b7 ');
}

export type AgainstDirection = 'below' | 'above' | 'inLine';

/**
 * C — where this review sits against the course average. Compared at the one
 * decimal both figures are printed at, so "In line with 7.1" never sits beside
 * 7.1. Null (no line) when there is no rating or no batched average.
 */
export function againstCourse(
  rating: number | null | undefined,
  avg: number | null | undefined,
): { direction: AgainstDirection; avg: number } | null {
  if (rating == null || avg == null || !Number.isFinite(Number(avg))) return null;
  const r = Math.round(Number(rating) * 10);
  const a = Math.round(Number(avg) * 10);
  const direction: AgainstDirection = r < a ? 'below' : r > a ? 'above' : 'inLine';
  return { direction, avg: a / 10 };
}

/** E — the body clamp. No padding of its own: the wrapper owns it (E.2). */
export const REVIEW_BODY_CLAMP = {
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
} as const;
