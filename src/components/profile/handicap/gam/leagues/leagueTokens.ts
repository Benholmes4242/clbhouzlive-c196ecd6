import { BRACKET_EMOJI } from '../../whs/gam/tokens';

export const POD_SIZE = 30;
export const PROMOTE_COUNT = 7;
export const RELEGATE_COUNT = 5;

/** Percentages (sum = 100). */
export const PROMOTE_PCT = (PROMOTE_COUNT / POD_SIZE) * 100;          // 23.33
export const RELEGATE_PCT = (RELEGATE_COUNT / POD_SIZE) * 100;        // 16.67
export const SAFE_PCT = 100 - PROMOTE_PCT - RELEGATE_PCT;             // 60

export const ZONE_COLORS = {
  promotion: '#059669',
  safe: 'rgba(148,163,184,0.30)',
  relegation: '#DC2626',
  self: '#F7931E',
} as const;

export function bracketLabel(bracket: string): string {
  if (!bracket) return 'League';
  return `${bracket[0].toUpperCase()}${bracket.slice(1)} League`;
}

export function bracketEmoji(bracket: string): string {
  return BRACKET_EMOJI[bracket as keyof typeof BRACKET_EMOJI] ?? '🏅';
}

export function seasonLabel(season: string): string {
  // e.g. 'spring_2026' -> 'Spring 2026'
  return season
    .split('_')
    .map((part) =>
      /^\d/.test(part) ? part : part[0].toUpperCase() + part.slice(1),
    )
    .join(' ');
}

export function daysLeft(isoEnd: string): number {
  const end = new Date(isoEnd).getTime();
  if (!Number.isFinite(end)) return 0;
  return Math.max(0, Math.ceil((end - Date.now()) / 86400000));
}

export function zoneFor(rank: number): 'promotion' | 'safe' | 'relegation' {
  if (rank <= PROMOTE_COUNT) return 'promotion';
  if (rank > POD_SIZE - RELEGATE_COUNT) return 'relegation';
  return 'safe';
}
