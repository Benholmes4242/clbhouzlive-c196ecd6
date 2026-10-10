/**
 * ONE SET OF ROW METRICS (Leaderboards Phase 4.1).
 *
 * Read by BoardRowView (board rows) and CompactRow (season rows on the
 * Leaderboards page) so two separate components share one geometry. Values are
 * the board row's. The podium keeps its own larger values in BoardRows.tsx.
 */
export const ROW_METRICS = {
  avatar: 28,
  nameSize: 14,
  nameWeight: 600,
  nameLine: '14px',
  subSize: 11,
  subLine: '12px',
  figureSize: 16,
  figureWeight: 700,
  secondarySize: 12.5,
  secondaryWeight: 700,
  posSize: 13,
  posWeight: 700,
  posTrack: 28,
  padY: 6,
} as const;
