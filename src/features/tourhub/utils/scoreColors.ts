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
    text: '#F7931E',           // amber — same as birdie
    bg: 'rgba(247, 147, 30, 0.20)',
    ring: 'rgba(247, 147, 30, 0.35)',
    tailwindText: 'text-[#F7931E]',
    tailwindBg: 'bg-[#F7931E]/20 ring-1 ring-[#F7931E]/35',
  },
  // Birdie
  birdie: {
    text: '#F7931E',           // amber
    bg: 'rgba(247, 147, 30, 0.15)',
    ring: 'rgba(247, 147, 30, 0.30)',
    tailwindText: 'text-[#F7931E]',
    tailwindBg: 'bg-[#F7931E]/15 ring-1 ring-[#F7931E]/30',
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
    text: '#EF4444',           // red
    bg: 'rgba(239, 68, 68, 0.15)',
    ring: 'rgba(239, 68, 68, 0.30)',
    tailwindText: 'text-red-500',
    tailwindBg: 'bg-red-500/15 ring-1 ring-red-500/30',
  },
  // Double bogey or worse
  doublePlus: {
    text: '#991B1B',           // dark red — worse than bogey
    bg: 'rgba(153, 27, 27, 0.20)',
    ring: 'rgba(153, 27, 27, 0.35)',
    tailwindText: 'text-red-800',
    tailwindBg: 'bg-red-800/20 ring-1 ring-red-800/35',
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
