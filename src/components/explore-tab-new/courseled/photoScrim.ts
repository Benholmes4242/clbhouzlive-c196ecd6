/**
 * PHOTO SCRIM — ONE definition, shared by every card that puts white text and
 * glass chips over a venue photograph (BRIEF_ON_TOUR_TILE_ENRICHMENT §5).
 *
 * These three layers were tuned on FriendsPlayedRail and are now imported by
 * both it and OnTourThisWeek rather than retyped, because two copies of a
 * scrim drift. ORDER MATTERS when painting: HOTSPOT, then BASE, then TOP.
 *
 *   BASE     bottom-weighted, carries the venue name block
 *   HOTSPOT  a footprint-sized pool under the bottom-left chip / name
 *   TOP      exists BECAUSE the base is bottom-weighted and the badges at the
 *            top would otherwise float on bare photograph
 */

export const SCRIM_BASE =
  'linear-gradient(0deg, rgba(10,14,10,0.66) 0%, rgba(10,14,10,0.28) 38%, rgba(10,14,10,0) 72%)';

export const SCRIM_HOTSPOT =
  'radial-gradient(92% 132% at 2% 86%, rgba(8,12,8,0.86) 0%, rgba(8,12,8,0.52) 56%, rgba(8,12,8,0) 88%)';

export const SCRIM_TOP_BAND =
  'linear-gradient(180deg, rgba(8,12,8,0.34) 0%, rgba(8,12,8,0.10) 30%, rgba(8,12,8,0) 52%)';

/**
 * THE STANDOUT-TILE SCRIM — one bottom-weighted layer, the treatment used by
 * Standout Rounds and Personal Bests. "Who's been playing" and "On tour this
 * week" now paint THIS instead of the three-layer base/hotspot/top stack, so
 * every photo tile on Discover carries the same scrim. StandoutTile's
 * TILE_SCRIM re-exports this value, so there is still ONE definition.
 */
export const SCRIM_STANDOUT =
  'linear-gradient(0deg, rgba(10,14,10,0.82) 0%, rgba(10,14,10,0) 32%)';
