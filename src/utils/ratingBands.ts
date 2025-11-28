// Unified rating band system (System 2)
// Single source of truth for all rating displays across the app

export interface RatingBand {
  id: string;
  label: string;
  min: number;
  max: number;
  colorHex: string;
}

export const RATING_BANDS: RatingBand[] = [
  { id: 'outstanding', label: 'OUTSTANDING', min: 9.0, max: 10.0, colorHex: '#F4C15D' },
  { id: 'excellent', label: 'EXCELLENT', min: 8.0, max: 8.9, colorHex: '#22C55E' },
  { id: 'veryGood', label: 'VERY GOOD', min: 7.0, max: 7.9, colorHex: '#6EE7B7' },
  { id: 'good', label: 'GOOD', min: 6.0, max: 6.9, colorHex: '#64748B' },
  { id: 'fair', label: 'FAIR', min: 0.0, max: 5.9, colorHex: '#94A3B8' },
];

/**
 * Get the rating band for a given score
 * Returns the matching band or defaults to 'fair' if no match
 */
export function getRatingBand(score: number | null | undefined): RatingBand {
  if (score == null || Number.isNaN(score)) {
    return RATING_BANDS[RATING_BANDS.length - 1]; // Default to 'fair'
  }

  return (
    RATING_BANDS.find(b => score >= b.min && score <= b.max) ||
    RATING_BANDS[RATING_BANDS.length - 1]
  );
}

/**
 * Get just the band ID (for backwards compatibility)
 */
export function getRatingBandId(score: number | null | undefined): string {
  return getRatingBand(score).id;
}

/**
 * Get just the band label (for backwards compatibility)
 */
export function getRatingBandLabel(score: number | null | undefined): string {
  return getRatingBand(score).label;
}

/**
 * Get just the band color (for backwards compatibility)
 */
export function getRatingBandColor(score: number | null | undefined): string {
  return getRatingBand(score).colorHex;
}
