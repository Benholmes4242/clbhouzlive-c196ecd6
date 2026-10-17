/** CHAMPIONS_STATE_4: pure posted-card and defence derivations. Board RPC
 * ranks remain authoritative. Missing rival/window rows mean unknown, not zero.
 * Ninety-day rates are extrapolated only for cumulative boards; a score record
 * is not an accumulating quantity and has no honest overtaking velocity.
 */
import type { LegendCategory, LegendWindow } from '@/lib/gam/types';
import { CHAMPIONS_BOARD_DATA } from '../_shared/championsOrder';
import type { FlatRow } from './championsFlatBits';
import type { PostedBoard } from './championsReach';

export interface PostedCard {
  id: string; date: string; holes: number | null; gross: number | null; net: number | null;
  differential: number | null; stableford: number | null; birdies: number; eagles: number; aces: number; albatrosses: number;
}
export function postedBoards(cards: PostedCard[], categories: readonly LegendCategory[], window: LegendWindow, now = new Date()): Map<LegendCategory, PostedBoard> {
  const cutoff = now.getTime() - 90 * 86400000;
  // gam-evaluator/index.ts:2703 applies this eligibility to every legend,
  // including cumulative boards; a nine-hole tracked card still ends State 3.
  const inWindow = cards.filter(card => card.holes === 18 && (window !== '90d' || new Date(card.date).getTime() >= cutoff));
  return new Map(categories.map(category => {
    const data = CHAMPIONS_BOARD_DATA[category];
    if (data.kind === 'cumulative') {
      const key = data.name as 'birdies' | 'eagles' | 'aces' | 'albatrosses' | 'rounds';
      const value = key === 'rounds' ? inWindow.length : inWindow.reduce((sum, card) => sum + card[key], 0);
      return [category, { value, low: value, high: value }];
    }
    const key = data.kind === 'not-projectable' ? 'stableford' : data.projection === 'differential' ? 'differential' : data.projection ?? 'gross';
    const values = inWindow.filter(card => card.holes === 18).map(card => card[key]).filter((v): v is number => v != null && Number.isFinite(v));
    if (!values.length) return [category, { value: null, low: null, high: null }];
    const low = Math.min(...values), high = Math.max(...values);
    return [category, { value: key === 'stableford' ? high : low, low, high }];
  }));
}

/** One ordering supplies leaders, real pinned rank and the divider. A gap
 * counts people in the supplied ordering, not rank subtraction across ties.
 * No client-assigned rank for a viewer missing from the authoritative board.
 */
export function pinnedBoardRows(rows: readonly FlatRow[], visibleLeaders = 4) {
  const ordered = [...rows].sort((a, b) => a.rank - b.rank);
  const leaders = ordered.slice(0, visibleLeaders);
  const viewerIndex = ordered.findIndex(row => row.isSelf);
  const pinned = viewerIndex >= visibleLeaders ? ordered[viewerIndex] : null;
  const lastLeader = leaders[leaders.length - 1];
  const between = pinned && lastLeader ? ordered.filter(row => row.rank > lastLeader.rank && row.rank < pinned.rank).length : 0;
  return { ordered, leaders, pinned, between };
}
export function postedRankLabel(row: FlatRow, rows: readonly FlatRow[]): string {
  return `${rows.filter(other => other.rank === row.rank).length > 1 ? 'T' : ''}${row.rank}`;
}

export type Defence = { margin: number; gain90: number | null; date: Date | null; trend: 'closing' | 'holding' | 'pulling-away' | 'unknown' };
export function boardDefence(category: LegendCategory, viewer: FlatRow, rival: FlatRow, own90: number | null, rival90: number | null, now = new Date()): Defence {
  const margin = Number(Math.abs(viewer.value - rival.value).toFixed(1));
  if (CHAMPIONS_BOARD_DATA[category].kind !== 'cumulative' || own90 == null || rival90 == null) return { margin, gain90: null, date: null, trend: 'unknown' };
  const gain = rival90 - own90;
  if (gain <= 0) return { margin, gain90: null, date: null, trend: gain === 0 ? 'holding' : 'pulling-away' };
  const days = margin / gain * 90;
  const yearOut = new Date(now); yearOut.setUTCFullYear(yearOut.getUTCFullYear() + 1);
  const date = new Date(now.getTime() + Math.ceil(days) * 86400000);
  return { margin, gain90: date <= yearOut ? gain : null, date: date <= yearOut ? date : null, trend: 'closing' };
}