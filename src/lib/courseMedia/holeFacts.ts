/** HOLE FACTS — the one set of rules for a hole's facts on media, shared by
 * the course media viewer (CourseGalleryChrome), the feed hole chip's expanded
 * card and the full-screen viewer. Input is the hole-analysis walk
 * (`courseWalkHoles`): par/yards print only behind `scored` or from a known
 * tee-set fallback; stroke index and the field figure (toParParts of
 * avg_to_par) print only behind `scored`. Absent values stay absent. */
import type { CourseHole } from '@/hooks/gam/useCourseHoleAnalysis';
import { toParParts } from '@/features/courses/components/holes/analytical/tokens';
import { holeOrdinal } from './holeWalk';

export interface HoleFacts {
  holeNo: number;
  /** "The third" — callers uppercase visually. */
  kicker: string;
  par: number | null;
  yards: number | null;
  strokeIndex: number | null;
  /** "+0.7", "−0.2" or "E"; null without scored analysis. */
  field: string | null;
}

export interface HoleWalkData { holes: readonly CourseHole[]; scored: boolean }

export function holeFacts(
  walk: HoleWalkData | null | undefined,
  holeNo: number,
  fallback?: { par?: number | null; yards?: number | null } | null,
): HoleFacts {
  const hole = walk?.scored ? walk.holes.find((h) => h.hole_no === holeNo) : undefined;
  const par = hole?.par && hole.par > 0 ? hole.par : fallback?.par && fallback.par > 0 ? fallback.par : null;
  const yards = hole?.yards != null && hole.yards > 0 ? hole.yards : fallback?.yards != null && fallback.yards > 0 ? fallback.yards : null;
  const field = hole && Number.isFinite(hole.avg_to_par) ? toParParts(hole.avg_to_par)?.text ?? null : null;
  const word = holeOrdinal(holeNo);
  return {
    holeNo,
    kicker: `The ${word}`,
    par,
    yards,
    strokeIndex: hole?.stroke_index ?? null,
    field,
  };
}

/** "Par 4 · 412 yards", "Par 4", or null. */
export function holeFactsTitle(f: Pick<HoleFacts, 'par' | 'yards'>): string | null {
  if (f.par == null) return null;
  return f.yards != null ? `Par ${f.par} · ${f.yards} yards` : `Par ${f.par}`;
}
