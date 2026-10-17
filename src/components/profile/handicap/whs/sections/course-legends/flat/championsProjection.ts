/** State 3 presentation derivations. All scoring arithmetic belongs to coursePlay. */
import { projectedNet, projectedDifferential, type CourseProjection, type CoursePlayInputs, type ProjectedScoreRange } from '@/lib/whs/coursePlay';
import { CHAMPIONS_BOARD_DATA } from '../_shared/championsOrder';
import type { LegendCategory } from '@/lib/gam/types';
export function projectedBoardRange(category: LegendCategory, p: CourseProjection, inputs: CoursePlayInputs): ProjectedScoreRange | null {
  const data = CHAMPIONS_BOARD_DATA[category];
  if (data.kind !== 'projectable') return null;
  if (data.projection === 'net') return projectedNet(p);
  if (data.projection === 'differential') return projectedDifferential(p, inputs);
  return { typical: p.typicalGross, low: p.lowGross, high: p.highGross };
}
export function projectedTile(category: LegendCategory, standing: number | null, p: CourseProjection, inputs: CoursePlayInputs): { state: 'never-claimed' | 'held' | 'in-reach' | 'not-started'; gap?: number } {
  if (standing == null) return { state: 'never-claimed' };
  const data = CHAMPIONS_BOARD_DATA[category];
  if (data.kind === 'cumulative') return { state: 'not-started' };
  const range = projectedBoardRange(category, p, inputs);
  if (!range) return { state: 'held' };
  return range.low <= standing ? { state: 'in-reach' } : { state: 'held', gap: Number((range.low - standing).toFixed(1)) };
}