/**
 * MEDAL TONES — the one home for the three round-award medal colours.
 * Not SC_FILL_GOLD (eagles/aces) and not AMBER (the viewing member).
 * medalTierTone maps an award TIER to its colour; it is NOT the trophy-room
 * medalTone, which maps ladder progress.
 */
export const MEDAL_GOLD = '#D6A84B';
export const MEDAL_SILVER = '#8E99A8';
export const MEDAL_BRONZE = '#A9683A';

export function medalTierTone(tier: 'gold' | 'silver' | 'bronze'): string {
  if (tier === 'gold') return MEDAL_GOLD;
  if (tier === 'silver') return MEDAL_SILVER;
  return MEDAL_BRONZE;
}
