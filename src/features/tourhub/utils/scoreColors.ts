/**
 * Unified score color palette for all golf scoring surfaces.
 * 
 * Convention:
 * - Gold/Yellow: Eagle or better (prestige)
 * - Green: Birdie (golf convention — under par is green)
 * - White/Muted: Par (neutral)
 * - Orange: Bogey (warning)
 * - Red: Double bogey or worse (danger)
 * 
 * Used by: PlayerScorecardCard, WinnerStatsPanel, StatChip, 
 * RoundSummary, and any future scoring UI.
 */

export const SCORE_COLORS = {
  // Eagle or better (includes hole-in-one on par 3+, albatross, condor)
  eagle: {
    text: '#FACC15',           // yellow-400
    bg: 'rgba(250, 204, 21, 0.15)',
    ring: 'rgba(250, 204, 21, 0.30)',
    tailwindText: 'text-yellow-400',
    tailwindBg: 'bg-yellow-400/15 ring-1 ring-yellow-400/30',
  },
  // Birdie
  birdie: {
    text: '#22C55E',           // green-500
    bg: 'rgba(34, 197, 94, 0.15)',
    ring: 'rgba(34, 197, 94, 0.30)',
    tailwindText: 'text-green-500',
    tailwindBg: 'bg-green-500/15 ring-1 ring-green-500/30',
  },
  // Par
  par: {
    text: 'rgba(255, 255, 255, 0.7)',
    bg: 'rgba(255, 255, 255, 0.05)',
    ring: 'transparent',
    tailwindText: 'text-white/70',
    tailwindBg: 'bg-white/5',
  },
  // Bogey
  bogey: {
    text: '#FF9500',           // orange
    bg: 'rgba(255, 149, 0, 0.15)',
    ring: 'rgba(255, 149, 0, 0.30)',
    tailwindText: 'text-orange-400',
    tailwindBg: 'bg-orange-400/15 ring-1 ring-orange-400/30',
  },
  // Double bogey or worse
  doublePlus: {
    text: '#EF4444',           // red-500
    bg: 'rgba(239, 68, 68, 0.15)',
    ring: 'rgba(239, 68, 68, 0.30)',
    tailwindText: 'text-red-500',
    tailwindBg: 'bg-red-500/15 ring-1 ring-red-500/30',
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
