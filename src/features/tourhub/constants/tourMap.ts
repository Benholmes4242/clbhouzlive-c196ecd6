import { NEAR_BLACK_CONTROL_SURFACE } from '@/lib/tokens/surfaces';

/**
 * tourMap — central source of truth for tour metadata.
 *
 * Keyed by DB code (as stored on `sr_tournaments.tour_code`). The DB casing
 * is a historical artifact (`pga` is lowercase, others uppercase) — internal
 * logic uses these codes verbatim, but `pillCode` translates to clean uppercase
 * display codes for user-facing TourPill rendering.
 *
 *   label     — full tour name (e.g. "DP World Tour")
 *   short     — short label for menus (e.g. "Champions")
 *   pillCode  — clean uppercase code shown inside TourPill (e.g. "DPWT")
 *   bg / fg   — TourPill colors (brand)
 */
export type TourCode = 'pga' | 'EURO' | 'LPGA' | 'CHAMP' | 'PGAD' | 'LIV';

export interface TourMeta {
  retired?: boolean;
  label: string;
  short: string;
  pillCode: string;
  bg: string;
  fg: string;
}

export const TOUR_MAP: Record<TourCode, TourMeta> = {
  pga: {
    label: 'PGA Tour',
    short: 'PGA Tour',
    pillCode: 'PGA Tour',
    bg: '#003C80',
    fg: '#FFFFFF',
  },
  EURO: {
    label: 'DP World Tour',
    short: 'DP World Tour',
    pillCode: 'DP World Tour',
    bg: NEAR_BLACK_CONTROL_SURFACE,
    fg: '#FFFFFF',
  },
  LPGA: {
    label: 'LPGA Tour',
    short: 'LPGA',
    pillCode: 'LPGA Tour',
    bg: '#00518A',
    fg: '#FFFFFF',
  },
  CHAMP: {
    label: 'Champions Tour',
    short: 'Champions',
    pillCode: 'Champions Tour',
    bg: '#C5A561',
    fg: '#000000',
  },
  PGAD: {
    label: 'Korn Ferry Tour',
    short: 'Korn Ferry',
    pillCode: 'Korn Ferry Tour',
    bg: '#1E7F4D',
    fg: '#FFFFFF',
  },
  LIV: {
    retired: true,
    label: 'LIV Golf',
    short: 'LIV Golf',
    pillCode: 'LIV Golf',
    bg: '#84CC16',
    fg: '#000000',
  },
};

/** Eligibility lives here; historical metadata and readers retain every code. */
export const TOUR_SLUGS = ['pga', 'lpga', 'euro', 'pgad', 'champ', 'liv'] as const;
export type RegistryTourSlug = typeof TOUR_SLUGS[number];
const SLUG_CODE: Record<RegistryTourSlug, TourCode> = { pga: 'pga', lpga: 'LPGA', euro: 'EURO', pgad: 'PGAD', champ: 'CHAMP', liv: 'LIV' };
export function isRetiredTour(value: string | null | undefined): boolean {
  if (!value) return false;
  const normalized = value.toLowerCase().trim();
  const slug = TOUR_SLUGS.find(s => s === normalized || TOUR_MAP[SLUG_CODE[s]].label.toLowerCase() === normalized || TOUR_MAP[SLUG_CODE[s]].short.toLowerCase() === normalized || (s === 'liv' && (normalized === 'liv-golf' || normalized === 'livpts')));
  return slug ? TOUR_MAP[SLUG_CODE[slug]].retired === true : false;
}
export function isActiveTour(value: string): boolean {
  return (TOUR_SLUGS as readonly string[]).includes(value) && !isRetiredTour(value);
}
export const ACTIVE_TOUR_SLUGS = TOUR_SLUGS.filter(isActiveTour);
export function activeTourList<T extends string>(values: readonly T[]): T[] {
  return values.filter(value => !isRetiredTour(value));
}
export const REGISTRY_TOUR_DISPLAY = Object.fromEntries(TOUR_SLUGS.map(slug => [slug, TOUR_MAP[SLUG_CODE[slug]].short]));

/** Lookup helper — never throws; returns undefined if code is unknown. */
export function getTourMeta(code: string | null | undefined): TourMeta | undefined {
  if (!code) return undefined;
  return TOUR_MAP[code as TourCode];
}

/** Convenience — returns label or the raw code as fallback. */
export function getTourLabel(code: string | null | undefined): string {
  return getTourMeta(code)?.label ?? code ?? 'Tour';
}

/** Convenience — returns short label or the raw code. */
export function getTourShort(code: string | null | undefined): string {
  return getTourMeta(code)?.short ?? code ?? 'Tour';
}
