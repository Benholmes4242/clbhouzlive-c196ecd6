// Shared round-feat derivation. Single source of truth for the chips used by
// Discover "Friends' latest rounds" and "The record book". Do not fork this
// logic - both surfaces must always agree.

/** Feat keys, rarest first. Mirrors the chip priority order. */
export type RoundFeatKey =
  | 'holes_in_one'
  | 'albatrosses'
  | 'beat_par'
  | 'eagles'
  | 'birdies'
  | 'clean_card';

export interface RoundFeat {
  key: RoundFeatKey;
  /** Occurrence count; 1 for boolean feats. */
  count: number;
}

/**
 * The CLIENT's single source for the birdie-haul threshold. It is NOT
 * the only copy of this number, and the copies cannot import each
 * other:
 *   - supabase/functions/gam-evaluator/index.ts, five_birdie_round,
 *     has its own literal.
 *   - public.refresh_discover_feats has its own literal, and it is
 *     the ONE that decides which rounds become birdie_haul rows in
 *     discover_rail_cache.
 *   - get_explore_stream has NO threshold. It reads
 *     discover_rail_cache at 'feats:worldwide:birdie_hauls' and
 *     inherits refresh_discover_feats's number.
 * So the server decides what is a haul and this constant decides how
 * the client describes it. If they disagree, the stream serves a card
 * the client will not mark. Move all three together, and re-run
 * refresh_discover_feats afterwards or the cache keeps the old gate.
 */
export const BIRDIE_HAUL_THRESHOLD = 5;

export interface RoundFeatStats {
  birdies?: number | null;
  eagles?: number | null;
  albatrosses?: number | null;
  holes_in_one?: number | null;
  beat_par?: boolean | null;
  clean_card?: boolean | null;
}

/**
 * Priority order (Ben, round 3): hole in one, albatross, under par, eagle,
 * birdie haul, clean card. Capped at two per row; surfaces may show fewer by
 * slicing the returned list.
 */
export function deriveRoundFeats(r: RoundFeatStats | null | undefined): RoundFeat[] {
  if (!r) return [];
  const out: RoundFeat[] = [];
  const aces = Number(r.holes_in_one ?? 0);
  const albs = Number(r.albatrosses ?? 0);
  const eagles = Number(r.eagles ?? 0);
  const birdies = Number(r.birdies ?? 0);
  if (aces >= 1) out.push({ key: 'holes_in_one', count: aces });
  if (albs >= 1) out.push({ key: 'albatrosses', count: albs });
  if (r.beat_par === true) out.push({ key: 'beat_par', count: 1 });
  if (eagles >= 1) out.push({ key: 'eagles', count: eagles });
  if (birdies >= BIRDIE_HAUL_THRESHOLD) out.push({ key: 'birdies', count: birdies });
  if (r.clean_card === true) out.push({ key: 'clean_card', count: 1 });
  return out.slice(0, 2);
}
