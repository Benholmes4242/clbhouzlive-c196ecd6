/**
 * CHAMPIONS_STATE_1_R: last verified pair supplied by Ben, recorded 2026-10-17.
 * Original measurement date was not supplied; fresh values are pending replacement.
 * SQL to refresh the snapshot lives with Ben. No per-view query belongs here.
 * This module alone stores the pair; the empty count is always derived.
 */
export const CHAMPIONS_CATALOGUE_TOTAL = 23_292;
export const CHAMPIONS_CATALOGUE_WITH_TRACKED_ROUNDS = 296;

export function championsCatalogueWithoutRounds(): number {
  return CHAMPIONS_CATALOGUE_TOTAL - CHAMPIONS_CATALOGUE_WITH_TRACKED_ROUNDS;
}