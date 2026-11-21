/** The Latest holes and Latest from the courses rails share one tile height
 * (Ben, 27 Oct 2026). LatestHolesSection re-exports these so existing imports
 * keep working; LatestCoursesSection imports them here to avoid a cycle through
 * the shell file. */
export const LATEST_HOLE_W = 220;
export const LATEST_HOLE_H = 293;

/** What's been played widths use stored media geometry only, never loaded
 * image/poster dimensions, so photo loading cannot shift a rail. */
export const RAIL_TILE_W_WIDE = 252;
export function railTileWidth(width: number | null | undefined, height: number | null | undefined): number {
  return typeof width === 'number' && typeof height === 'number'
    && Number.isFinite(width) && Number.isFinite(height)
    && width > 0 && height > 0 && width >= height * 0.95
    ? RAIL_TILE_W_WIDE : 156;
}
