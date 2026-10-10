import { A } from '@/features/courses/components/holes/analytical/tokens';
import { SEASON_ROW_METRICS } from '@/components/explore-tab-new/courseled/rowMetrics';

/**
 * THE HUNDRED — every size, colour and spacing value the section writes lives
 * here, named for what it is. The shared Rail, RailChips and RAIL_CARD are not
 * this section's and are not read.
 */
export const THE_HUNDRED = {
  /** Space under the list chips, the slab and the basis sentence. */
  blockGap: 12,
  /** Space above the course strip's sub-head. */
  stripTop: 16,
  slab: {
    radius: 11,
    background: 'rgba(255,255,255,0.05)',
    bar: 2.5,
    padding: '11px 12px 12px 14px',
    padTop: 11,
    padBottom: 12,
    fontSize: 12,
    lineHeight: 1.45,
    track: { marginTop: 9, height: 4, background: 'rgba(255,255,255,0.08)' },
    caption: { marginTop: 6, fontSize: 9, lineHeight: 12, fontWeight: 800, letterSpacing: '0.1em' },
  },
  basis: { fontSize: 11.5, lineHeight: 1.45 },
  subHead: { fontSize: 10, lineHeight: 14, fontWeight: 700, letterSpacing: '0.14em', countSize: 10 },
  rail: { gap: 8, endSpacer: 14, fade: 30 },
  tile: {
    width: 108,
    height: 76,
    radius: 10,
    text: '#FFF',
    textShadow: '0 1px 4px rgba(0,0,0,0.9)',
    scrim: 'linear-gradient(180deg, rgba(0,0,0,0.05), rgba(0,0,0,0.76))',
    rank: { inset: 6, top: 5, fontSize: 9 },
    caption: { inset: 6, bottom: 5, fontSize: 9, letterSpacing: '0.04em', lineHeight: 1.15 },
    played: { size: 17, inset: 6, ink: A.CANVAS, check: 11 },
    next: { inset: 7, fontSize: 8, letterSpacing: '0.1em', padding: '1px 5px', ink: A.CANVAS, ground: A.INK },
  },
  row: {
    progress: { marginTop: 5, height: 3, background: 'rgba(255,255,255,0.08)', fill: 'rgba(248,250,252,0.55)' },
  },
  empty: { fontSize: 13, padding: '12px 0' },
  sheetChips: { padding: '11px 16px' },
} as const;

/* ------------------------------------------------------- placeholder heights */

const S = THE_HUNDRED.slab;
/** Two sentence lines are assumed: the played sentence runs ~95 characters at
 *  12px against a ~366px measure, so it wraps at every phone width. */
const slabLine = Math.round(S.fontSize * S.lineHeight); // 17
/** 11 + 2×17 + 9 + 4 + 6 + 12 + 12 = 88. */
export const HUNDRED_SLAB_HEIGHT =
  S.padTop + 2 * slabLine + S.track.marginTop + S.track.height + S.caption.marginTop + S.caption.lineHeight + S.padBottom;
/** Sub-head 16 + 14, tile row 76, gap below 12 = 118. */
export const HUNDRED_STRIP_HEIGHT =
  THE_HUNDRED.stripTop + THE_HUNDRED.subHead.lineHeight + THE_HUNDRED.tile.height + THE_HUNDRED.blockGap;
/** A Top 100 row with its progress bar: 6 + (14 + 1 + 12 + 5 + 3) + 6 + 1 hairline = 48. */
export const HUNDRED_ROW_HEIGHT =
  SEASON_ROW_METRICS.padY * 2 + 14 + 1 + 12 + THE_HUNDRED.row.progress.marginTop + THE_HUNDRED.row.progress.height + 1;
/** Rows area while the board loads: three rows, no pinned row = 144. */
export const HUNDRED_ROWS_HEIGHT = 3 * HUNDRED_ROW_HEIGHT;
/** Basis sentence: two lines of 11.5 × 1.45 (17) + 12 below = 46. */
export const HUNDRED_BASIS_HEIGHT = 2 * Math.round(THE_HUNDRED.basis.fontSize * THE_HUNDRED.basis.lineHeight) + THE_HUNDRED.blockGap;

/**
 * Whole-section placeholder while the default list's board loads:
 * section top 24 + eyebrow 13 + 5 + title 23 + 12 + chips 30 + 12
 * + (slab 88 + 12, signed in) + basis 46 + (strip 118, signed in) + rows 144
 * + See all 12 + 13 = 334 signed out, 552 signed in.
 */
export function hundredPlaceholderHeight(signedIn: boolean): number {
  const head = 24 + 13 + 5 + 23 + 12 + 30 + THE_HUNDRED.blockGap;
  const you = signedIn ? HUNDRED_SLAB_HEIGHT + THE_HUNDRED.blockGap + HUNDRED_STRIP_HEIGHT : 0;
  return head + you + HUNDRED_BASIS_HEIGHT + HUNDRED_ROWS_HEIGHT + 12 + 13;
}

/* ------------------------------------------------------------ slab + rail */

export interface HundredBoardRow {
  user_id: string;
  display_name: string | null;
  value: number | string;
  pos: number;
  total_members: number | string;
  is_viewer: boolean | null;
}

export type HundredSlab =
  | { kind: 'absent'; n: 0 }
  | { kind: 'played'; n: number; pos: number; total: number; clause: null | { kind: 'behind'; gap: number; leader: string | null } | { kind: 'clear'; gap: number; second: string | null } };

/** The slab's state from the board rows alone. */
export function hundredSlab(rows: HundredBoardRow[], viewerId: string | undefined): HundredSlab {
  const mine = rows.find((r) => r.is_viewer) ?? (viewerId ? rows.find((r) => r.user_id === viewerId) : undefined);
  if (!mine) return { kind: 'absent', n: 0 };
  const n = Number(mine.value);
  const base = { kind: 'played' as const, n, pos: mine.pos, total: Number(mine.total_members) };
  const leader = rows[0];
  if (leader.user_id === mine.user_id) {
    const second = rows[1];
    const gap = second ? n - Number(second.value) : 0;
    return { ...base, clause: second && gap > 0 ? { kind: 'clear', gap, second: second.display_name } : null };
  }
  const gap = Number(leader.value) - n;
  return { ...base, clause: gap > 0 ? { kind: 'behind', gap, leader: leader.display_name } : null };
}

/** Index of the first unplayed tile, or null when it is 0 or every course is played. */
export function firstUnplayedIndex(tiles: { is_viewer_played: boolean }[]): number | null {
  const i = tiles.findIndex((c) => !c.is_viewer_played);
  return i <= 0 ? null : i;
}

/** Rail scroll position for the first unplayed tile: index × (tile + gap) − gutter. */
export function hundredRailScroll(index: number | null, gutter: number): number {
  if (index == null) return 0;
  return Math.max(0, index * (THE_HUNDRED.tile.width + THE_HUNDRED.rail.gap) - gutter);
}
