/** CHAMPIONS_STATE_4: reach has an explicit basis. Only tracked course cards
 * choose it; connection, index, selected board and field size never do.
 * Projected conversions remain owned by coursePlay; posted ranges are cards,
 * not a reconstructed score or an index applied retrospectively.
 */
import type { LegendCategory } from '@/lib/gam/types';
import { CHAMPIONS_BOARD_DATA } from '../_shared/championsOrder';
import { projectedNet, projectedDifferential, type CourseProjection, type CoursePlayInputs } from '@/lib/whs/coursePlay';

export type ReachBasis = 'projected' | 'posted';
export const reachBasisFor = (hasTrackedRounds: boolean): ReachBasis => hasTrackedRounds ? 'posted' : 'projected';
export interface PostedBoard { value: number | null; low: number | null; high: number | null }
export interface ReachResult { state: 'never-claimed' | 'held' | 'in-reach' | 'not-started' | 'yours'; gap?: number }
export function championsReach(basis: ReachBasis, category: LegendCategory, standing: number | null, options: {
  projection?: CourseProjection | null; inputs?: CoursePlayInputs | null; posted?: PostedBoard; owns?: boolean;
}): ReachResult {
  if (standing == null) return { state: 'never-claimed' };
  if (basis === 'posted' && options.owns) return { state: 'yours' };
  const data = CHAMPIONS_BOARD_DATA[category];
  if (basis === 'projected') {
    if (data.kind === 'cumulative') return { state: 'not-started' };
    if (data.kind !== 'projectable' || !options.projection || !options.inputs) return { state: 'held' };
    const p = options.projection;
    const range = data.projection === 'net' ? projectedNet(p) : data.projection === 'differential' ? projectedDifferential(p, options.inputs) : { low: p.lowGross };
    return range.low <= standing ? { state: 'in-reach' } : { state: 'held', gap: Number((range.low - standing).toFixed(1)) };
  }
  const posted = options.posted;
  if (posted?.value == null) return { state: 'held' };
  const gap = Number(Math.abs(standing - posted.value).toFixed(1));
  if (data.kind === 'cumulative') return gap === 1 ? { state: 'in-reach', gap } : { state: 'held', gap };
  // Stableford is allowed only from posted points. Lower wins on differential
  // as well as gross/net; never borrow the legacy row's upwards default.
  const higherWins = data.kind === 'not-projectable';
  const reaches = higherWins ? posted.high != null && posted.high >= standing : posted.low != null && posted.low <= standing;
  return reaches ? { state: 'in-reach', gap } : { state: 'held', gap };
}