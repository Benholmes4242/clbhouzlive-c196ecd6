/** T100 pure board/rail rules. Tie ruling: joint positions omit gap clauses.
 * Rail scrolling retains the original algorithm, with the signed-off tile pitch. */
export interface HundredBoardRow {
  user_id: string; display_name: string | null; value: number | string; pos: number;
  total_members: number | string; is_viewer: boolean | null; is_tie?: boolean;
}
export type HundredSlab =
  | { kind: 'absent'; n: 0 }
  | { kind: 'played'; n: number; pos: number; total: number; tie: boolean; clause: null | { kind: 'behind'; gap: number; leader: string | null } | { kind: 'clear'; gap: number; second: string | null } };
export function hundredSlab(rows: HundredBoardRow[], viewerId: string | undefined): HundredSlab {
  const mine = rows.find(r => r.is_viewer) ?? (viewerId ? rows.find(r => r.user_id === viewerId) : undefined);
  if (!mine) return { kind: 'absent', n: 0 };
  const n = Number(mine.value);
  const base = { kind: 'played' as const, n, pos: mine.pos, total: Number(mine.total_members), tie: Boolean(mine.is_tie) };
  const leader = rows[0];
  if (!leader || base.tie) return { ...base, clause: null };
  if (leader.user_id === mine.user_id) {
    const second = rows[1], gap = second ? n - Number(second.value) : 0;
    return { ...base, clause: second && gap > 0 ? { kind: 'clear', gap, second: second.display_name } : null };
  }
  const gap = Number(leader.value) - n;
  return { ...base, clause: gap > 0 ? { kind: 'behind', gap, leader: leader.display_name } : null };
}
export const RACE_TILE_WIDTH = 116;
export const RACE_TILE_HEIGHT = 80;
export const RACE_TILE_GAP = 8;
export function firstUnplayedIndex(tiles: { is_viewer_played: boolean }[]): number | null {
  const i = tiles.findIndex(c => !c.is_viewer_played);
  return i <= 0 ? null : i;
}
export function hundredVisibleTiles(clientWidth: number, gutter: number): number {
  return Math.max(0, Math.floor((clientWidth - gutter + RACE_TILE_GAP) / (RACE_TILE_WIDTH + RACE_TILE_GAP)));
}
export function hundredRailScroll(index: number | null, gutter: number, clientWidth: number): number {
  if (index == null || index < hundredVisibleTiles(clientWidth, gutter)) return 0;
  return Math.max(0, (index - 1) * (RACE_TILE_WIDTH + RACE_TILE_GAP) - gutter);
}
export function raceShare(n: number, total: number): number { return total > 0 ? Math.max(0, Math.min(1, n / total)) : 0; }
export function raceRows<T extends HundredBoardRow>(rows: T[], viewerId: string) {
  const top = rows.slice(0, 3);
  const mine = rows.find(r => r.is_viewer || r.user_id === viewerId);
  return { top, pinned: mine && mine.pos > 3 && !top.some(r => r.user_id === mine.user_id) ? mine : null };
}
/** Center a measured caption at the leader, leaving 8px beyond both end labels. */
export function leaderCaptionLeft(mark: number, width: number, caption: number, leftLabel: number, rightLabel: number): number {
  const min = leftLabel + 8, max = width - rightLabel - 8 - caption;
  return Math.max(min, Math.min(max, mark * width - caption / 2));
}