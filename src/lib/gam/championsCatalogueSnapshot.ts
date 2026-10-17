/**
 * CHAMPIONS_STATE_2 EA0: measured and confirmed by Ben on 2026-10-17.
 * The catalogue, tracked-course total and orphan check are confirmed clean.
 * SQL to refresh the snapshot lives with Ben. No per-view query belongs here.
 * This module alone stores the pair; the empty count is always derived.
 */
export const CHAMPIONS_CATALOGUE_TOTAL = 23_292;
export const CHAMPIONS_CATALOGUE_WITH_TRACKED_ROUNDS = 296;

export function championsCatalogueWithoutRounds(): number {
  return CHAMPIONS_CATALOGUE_TOTAL - CHAMPIONS_CATALOGUE_WITH_TRACKED_ROUNDS;
}