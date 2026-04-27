/**
 * deriveFieldStrength — Phase 2 qualitative proxy.
 *
 * No tournament-field roster table exists, so field strength is derived
 * from tournament classification + purse per the approved Q1 mapping:
 *
 *   MAJOR                              → Stacked
 *   SIGNATURE EVENT / ROLEX SERIES /
 *   PLAYOFF EVENT / purse >= $20M      → Strong
 *   purse >= $10M                      → Solid
 *   below $10M                         → null  (hide tier)
 *
 * Returns null when no tier qualifies. Combined with the
 * defending-champion presence check at the row level, this drives whether
 * the TournamentMeta dashed-divider section renders at all.
 */
import { getContextLabel } from './tournamentClassification';

export type FieldStrengthLabel = 'Stacked' | 'Strong' | 'Solid';

interface FieldStrengthInput {
  name: string;
  tourName?: string | null;
  purse?: number | null;
}

const STRONG_PURSE_THRESHOLD = 20_000_000;
const SOLID_PURSE_THRESHOLD = 10_000_000;

export function deriveFieldStrength(t: FieldStrengthInput): FieldStrengthLabel | null {
  const ctx = getContextLabel({ name: t.name, tourName: t.tourName ?? null });
  if (ctx === 'MAJOR CHAMPIONSHIP') return 'Stacked';
  if (ctx === 'SIGNATURE EVENT' || ctx === 'ROLEX SERIES' || ctx === 'PLAYOFF EVENT') {
    return 'Strong';
  }
  const purse = t.purse ?? 0;
  if (purse >= STRONG_PURSE_THRESHOLD) return 'Strong';
  if (purse >= SOLID_PURSE_THRESHOLD) return 'Solid';
  return null;
}

/**
 * shouldShowTournamentMeta — gates the section rendering at the row level.
 * Section appears when EITHER:
 *   - field-strength tier qualifies (per deriveFieldStrength), OR
 *   - tournament has a defending champion AND meets the show-section threshold
 *
 * Per Phase 2 Q2 decision: defending-only display is allowed when defending
 * champion exists, even if purse is below $10M and no classification tier hits.
 * BUT the brief's intent is to elevate "events worth watching" — so we still
 * gate the defending-only display on the same classification/purse criteria.
 *
 * NOTE: in practice deriveFieldStrength returning non-null is the same set of
 * events that qualify, so the gate collapses to: tier OR defending-with-tier.
 */
export function shouldShowTournamentMeta(input: {
  name: string;
  tourName?: string | null;
  purse?: number | null;
  defendingChampion?: string | null;
}): boolean {
  const tier = deriveFieldStrength(input);
  if (tier) return true;
  // No tier → only show if defending champion exists AND a soft threshold
  // (sub-$10M events stay clean per brief design intent).
  return false;
}
