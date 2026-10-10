/**
 * ONE SET OF ROW METRICS (Leaderboards Phase 4.1, values from the Phase 9 mock).
 *
 * Read by BoardRowView (board rows) and CompactRow (season rows on the
 * Leaderboards page) so two separate components share one geometry. The podium
 * is gone (9.12): no row owns larger values.
 */
export const ROW_METRICS = {
  avatar: 34,
  nameSize: 14.5,
  nameWeight: 700,
  nameLine: '18px',
  subSize: 11.5,
  subLine: '14px',
  figureSize: 18,
  figureWeight: 800,
  secondarySize: 12,
  secondaryWeight: 600,
  posSize: 13,
  posWeight: 800,
  posTrack: 20,
  padY: 10,
  padX: 16,
  colGap: 11,
  /** The pinned self row's break above it. */
  pinnedGap: 12,
} as const;
