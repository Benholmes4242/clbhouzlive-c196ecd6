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
    pillCode: 'PGA',
    bg: '#0A5A3C',
    fg: '#FFFFFF',
  },
  EURO: {
    label: 'DP World Tour',
    short: 'DP World Tour',
    pillCode: 'DPWT',
    bg: '#1E40AF',
    fg: '#FFFFFF',
  },
  LPGA: {
    label: 'LPGA Tour',
    short: 'LPGA',
    pillCode: 'LPGA',
    bg: '#BE185D',
    fg: '#FFFFFF',
  },
  CHAMP: {
    label: 'Champions Tour',
    short: 'Champions',
    pillCode: 'CHA',
    bg: '#7C3AED',
    fg: '#FFFFFF',
  },
  PGAD: {
    label: 'Korn Ferry Tour',
    short: 'Korn Ferry',
    pillCode: 'KFT',
    bg: '#0891B2',
    fg: '#FFFFFF',
  },
  LIV: {
    label: 'LIV Golf',
    short: 'LIV Golf',
    pillCode: 'LIV',
    bg: '#DC2626',
    fg: '#FFFFFF',
  },
};

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
