import { SEASON_ROW_METRICS as M } from '@/components/explore-tab-new/courseled/rowMetrics';

/**
 * THE CLIMB (§4) — every size and spacing value the section writes lives
 * here. Colours are read from the analytical `A` ramp at the call site. The
 * order toggle is Rare air's (RARE_AIR.toggle), read rather than copied.
 */
export const CLIMB = {
  slab: { marginTop: 12, radius: 11, bar: 2.5, padding: '10px 12px', fontSize: 12, lineHeight: 1.45 },
} as const;

export type ClimbMode = 'strokes' | 'share';

export interface ClimbSource {
  pos: number;
  is_tie: boolean;
  user_id: string;
  start_index: number | null;
  improvement: number | null;
  is_viewer?: boolean | null;
}

/**
 * improvement ÷ start_index, or null when it is not a number: no start on
 * file, a zero start (division by zero), or a PLUS start (negative index —
 * dividing by it inverts the sign, so a cut would read as a rise). No
 * low-index floor: halving 0.4 to 0.2 is exactly what this order is for.
 */
export function climbShare(r: Pick<ClimbSource, 'start_index' | 'improvement'>): number | null {
  if (r.start_index == null || r.improvement == null) return null;
  const start = Number(r.start_index);
  const imp = Number(r.improvement);
  if (!Number.isFinite(start) || !Number.isFinite(imp) || start <= 0) return null;
  return imp / start;
}

/** pos is null for a row OUTSIDE the ranking (Share order, share not a number): it renders a dash, never a shared position. */
export interface ClimbPlaced<R> { row: R; pos: number | null; tie: boolean; share: number | null }

/**
 * Both orders from the same rows. STROKES uses the RPC's own pos/is_tie — the
 * database already decided it. SHARE ranks on the UNROUNDED share with
 * competition ranking (1, 2, 2, 4); a tie only when the unrounded values are
 * equal. Rows whose share is not a number sort last, keep their strokes order,
 * and take NO position (null): they are outside the ranking, not level.
 */
export function climbOrder<R extends ClimbSource>(rows: ReadonlyArray<R>, mode: ClimbMode): ClimbPlaced<R>[] {
  if (mode === 'strokes') return rows.map((row) => ({ row, pos: row.pos, tie: row.is_tie, share: climbShare(row) }));
  const ranked = rows
    .map((row, i) => ({ row, i, share: climbShare(row) }))
    .filter((x) => x.share != null)
    .sort((a, b) => (b.share as number) - (a.share as number) || a.i - b.i);
  const out: ClimbPlaced<R>[] = ranked.map((x, k) => {
    let first = k;
    while (first > 0 && ranked[first - 1].share === x.share) first--;
    const tie = (k > 0 && ranked[k - 1].share === x.share) || (k < ranked.length - 1 && ranked[k + 1].share === x.share);
    return { row: x.row, pos: first + 1, tie, share: x.share };
  });
  const rest = rows.filter((r) => climbShare(r) == null);
  rest.forEach((row) => out.push({ row, pos: null, tie: false, share: null }));
  return out;
}

export type ClimbCross =
  | { kind: 'none' }
  | { kind: 'first'; pos: number; tie: boolean }
  | { kind: 'better'; pos: number; tie: boolean; otherPos: number; otherTie: boolean };

/**
 * The cross-order sentence: only when the viewer's position on the OTHER order
 * is strictly better than on the one shown. Never when absent or signed out.
 */
export function climbCross<R extends ClimbSource>(
  rows: ReadonlyArray<R>, mode: ClimbMode, viewerId: string | null | undefined,
): ClimbCross {
  if (!viewerId) return { kind: 'none' };
  const isMe = (r: R) => !!r.is_viewer || r.user_id === viewerId;
  const here = climbOrder(rows, mode).find((p) => isMe(p.row));
  const there = climbOrder(rows, mode === 'strokes' ? 'share' : 'strokes').find((p) => isMe(p.row));
  /* An unranked viewer (null position) has no standing to compare: no sentence. */
  if (!here || !there || here.pos == null || there.pos == null || there.pos >= here.pos) return { kind: 'none' };
  if (there.pos === 1) return { kind: 'first', pos: here.pos, tie: here.tie };
  return { kind: 'better', pos: here.pos, tie: here.tie, otherPos: there.pos, otherTie: there.tie };
}

/** One row with its two-track figure: padY 6 + figure 18 + secondary 14 + padY 6 + hairline 1 = 45. */
export const CLIMB_ROW_HEIGHT =
  M.padY * 2 + parseFloat(M.figureLine) + parseFloat(M.secondaryLine) + M.hairline;

/**
 * Placeholder = section top 24 + eyebrow 13 + 5 + title row 32 (the toggle:
 * 24 + 2×3 padding + 2×1 border, taller than the 23px title) + children gap 12
 * + 3 rows × 45 + See all (12 + 13) = 246. The cross-order slab is
 * conditional and not reserved.
 */
export function climbPlaceholderHeight(rows = 3): number {
  return 24 + 13 + 5 + 32 + 12 + rows * CLIMB_ROW_HEIGHT + 12 + 13;
}
