// Shared round-feat derivation. Single source of truth for the chips used by
// Discover "Friends' latest rounds" and "The record book". Do not fork this
// logic - both surfaces must always agree.

/** Feat keys, rarest first. Mirrors the chip priority order. */
export type RoundFeatKey =
  | 'holes_in_one'
  | 'albatrosses'
  | 'eagles'
  | 'birdies'
  | 'beat_par'
  | 'clean_card';

export interface RoundFeat {
  key: RoundFeatKey;
  /** Occurrence count; 1 for boolean feats. */
  count: number;
}

/** Birdie-haul threshold - MUST match refresh_discover_feats (birdie_count >= 4). */
export const BIRDIE_HAUL_THRESHOLD = 4;

export interface RoundFeatStats {
  birdies?: number | null;
  eagles?: number | null;
  albatrosses?: number | null;
  holes_in_one?: number | null;
  beat_par?: boolean | null;
  clean_card?: boolean | null;
}

/** Priority order is rarest first; capped at two per row. */
export function deriveRoundFeats(r: RoundFeatStats | null | undefined): RoundFeat[] {
  if (!r) return [];
  const out: RoundFeat[] = [];
  const aces = Number(r.holes_in_one ?? 0);
  const albs = Number(r.albatrosses ?? 0);
  const eagles = Number(r.eagles ?? 0);
  const birdies = Number(r.birdies ?? 0);
  if (aces >= 1) out.push({ key: 'holes_in_one', count: aces });
  if (albs >= 1) out.push({ key: 'albatrosses', count: albs });
  if (eagles >= 1) out.push({ key: 'eagles', count: eagles });
  if (birdies >= BIRDIE_HAUL_THRESHOLD) out.push({ key: 'birdies', count: birdies });
  if (r.beat_par === true) out.push({ key: 'beat_par', count: 1 });
  if (r.clean_card === true) out.push({ key: 'clean_card', count: 1 });
  return out.slice(0, 2);
}
