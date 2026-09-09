import type { CourseHole } from '@/hooks/gam/useCourseHoleAnalysis';
import type { MyHolePerformanceRow } from '@/hooks/gam/useMyHolePerformance';

export interface ParTypeRow {
  par: number;
  holes: number;
  field: number;
  you: number | null;
}

export function buildParTypeRows(
  holes: CourseHole[],
  myByHole: Map<number, MyHolePerformanceRow>,
): ParTypeRow[] {
  const byPar = new Map<number, CourseHole[]>();
  holes.forEach((hole) => {
    if (hole.par == null || !Number.isFinite(hole.avg_to_par)) return;
    const list = byPar.get(hole.par) ?? [];
    list.push(hole);
    byPar.set(hole.par, list);
  });
  return [...byPar.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([par, list]) => {
      const field = list.reduce((sum, hole) => sum + hole.avg_to_par, 0) / list.length;
      const mine = list.map((hole) => myByHole.get(hole.hole_no)?.avg_to_par ?? null);
      const complete = mine.every((value) => value != null && Number.isFinite(value));
      return {
        par,
        holes: list.length,
        field,
        you: complete ? (mine as number[]).reduce((sum, value) => sum + value, 0) / mine.length : null,
      };
    });
}