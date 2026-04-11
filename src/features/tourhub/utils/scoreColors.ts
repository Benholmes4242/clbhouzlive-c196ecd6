/**
 * Unified score color palette for all golf scoring surfaces.
 * 
 * Convention:
 * - White: Eagle or better / Birdie (under par is white)
 * - Muted grey: Par (neutral)
 * - Red: Bogey / Double bogey+ (over par is red)
 */

export const SCORE_COLORS = {
  // Eagle or better
  eagle: {
    text: '#ffffff',
    bg: 'rgba(255, 255, 255, 0.08)',
    ring: 'rgba(255, 255, 255, 0.6)',
    tailwindText: 'text-white',
    tailwindBg: 'bg-white/8 ring-1 ring-white/60',
  },
  // Birdie
  birdie: {
    text: '#ffffff',
    bg: 'rgba(255, 255, 255, 0.08)',
    ring: 'rgba(255, 255, 255, 0.6)',
    tailwindText: 'text-white',
    tailwindBg: 'bg-white/8 ring-1 ring-white/60',
  },
  // Par
  par: {
    text: 'rgba(255, 255, 255, 0.35)',
    bg: 'rgba(255, 255, 255, 0.04)',
    ring: 'rgba(255, 255, 255, 0.18)',
    tailwindText: 'text-white/35',
    tailwindBg: 'bg-white/4 ring-1 ring-white/18',
  },
  // Bogey
  bogey: {
    text: '#f87171',
    bg: 'rgba(248, 113, 113, 0.08)',
    ring: '#f87171',
    tailwindText: 'text-red-400',
    tailwindBg: 'bg-red-400/8 ring-1 ring-red-400',
  },
  // Double bogey or worse
  doublePlus: {
    text: '#f87171',
    bg: 'rgba(248, 113, 113, 0.08)',
    ring: '#f87171',
    tailwindText: 'text-red-400',
    tailwindBg: 'bg-red-400/8 ring-1 ring-red-400',
  },
} as const;

/** Get score color set for a given score-to-par value */
export function getScoreColorSet(scoreToPar: number) {
  if (scoreToPar <= -2) return SCORE_COLORS.eagle;
  if (scoreToPar === -1) return SCORE_COLORS.birdie;
  if (scoreToPar === 0) return SCORE_COLORS.par;
  if (scoreToPar === 1) return SCORE_COLORS.bogey;
  return SCORE_COLORS.doublePlus;
}

/** Get Tailwind text class for score-to-par */
export function getScoreTextClass(scoreToPar: number): string {
  return getScoreColorSet(scoreToPar).tailwindText;
}

/** Get Tailwind background class for score-to-par */
export function getScoreBgClass(scoreToPar: number): string {
  return getScoreColorSet(scoreToPar).tailwindBg;
}

/** Label for score-to-par value */
export function getScoreLabel(scoreToPar: number): string {
  if (scoreToPar <= -3) return 'Albatross';
  if (scoreToPar === -2) return 'Eagle';
  if (scoreToPar === -1) return 'Birdie';
  if (scoreToPar === 0) return 'Par';
  if (scoreToPar === 1) return 'Bogey';
  if (scoreToPar === 2) return 'Double Bogey';
  return 'Triple+';
}
