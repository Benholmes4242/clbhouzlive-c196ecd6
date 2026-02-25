/**
 * Season Color Utilities
 * Generates gradient variants from a base season color.
 */

export interface SeasonGradient {
  dark: string;
  mid: string;
  light: string;
  tint: string;        // 12% opacity bg tint
  subtleTint: string;  // 4% opacity bg tint
}

const GRADIENTS: Record<string, SeasonGradient> = {
  '#3EBD93': { // Pre-Season (fresh emerald)
    dark: '#2A9B78',
    mid: '#3EBD93',
    light: '#6DD4B1',
    tint: 'rgba(62, 189, 147, 0.12)',
    subtleTint: 'rgba(62, 189, 147, 0.04)',
  },
  '#006747': { // Major (Augusta green)
    dark: '#004D35',
    mid: '#006747',
    light: '#00896B',
    tint: 'rgba(0, 103, 71, 0.12)',
    subtleTint: 'rgba(0, 103, 71, 0.04)',
  },
  '#F59E0B': { // Summer (amber)
    dark: '#D97706',
    mid: '#F59E0B',
    light: '#FBBF24',
    tint: 'rgba(245, 158, 11, 0.12)',
    subtleTint: 'rgba(245, 158, 11, 0.04)',
  },
  '#475569': { // Off-Season (slate)
    dark: '#334155',
    mid: '#475569',
    light: '#64748B',
    tint: 'rgba(71, 85, 105, 0.12)',
    subtleTint: 'rgba(71, 85, 105, 0.04)',
  },
};

// Default fallback — Major (Augusta green)
const DEFAULT_GRADIENT = GRADIENTS['#006747'];

/**
 * Get gradient triplet + tints from a season's base color.
 */
export function getSeasonGradient(baseColor: string): SeasonGradient {
  return GRADIENTS[baseColor] ?? DEFAULT_GRADIENT;
}
