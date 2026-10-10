/**
 * TWO NAMED ROW SCALES, ONE FILE (Leaderboards Phase 10.1).
 *
 * The hierarchy between them is intended. A board row carries a squircle, two
 * figures and an index chip and is the subject of the screen; a season row
 * carries one member total and supports it. Nothing outside this file defines
 * a row size. The podium scale is gone (9.12) and does not come back.
 */

/** Board rows — BoardRowView (lead board and See-all sheets). */
export const BOARD_ROW_METRICS = {
  avatar: 34,
  nameSize: 14.5,
  nameWeight: 700,
  nameLine: '18px',
  subSize: 11.5,
  subWeight: 400,
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

/** Season rows — CompactRow (career, Top 100, most improved, BoardSheet). */
export const SEASON_ROW_METRICS = {
  avatar: 28,
  nameSize: 14,
  nameWeight: 600,
  nameLine: '18px',
  subSize: 11,
  subWeight: 600,
  subLine: '14px',
  figureSize: 16,
  figureWeight: 700,
  secondarySize: 12.5,
  secondaryWeight: 700,
  posSize: 13,
  posWeight: 700,
  posTrack: 28,
  padY: 6,
  colGap: 10,
  /** The pinned self row's break above it. */
  pinnedGap: 12,
} as const;
