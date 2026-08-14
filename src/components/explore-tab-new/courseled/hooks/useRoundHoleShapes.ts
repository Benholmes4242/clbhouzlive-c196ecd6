import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';
import { beadForScore } from '@/features/courses/_shared/beadForScore';

/**
 * useRoundHoleShapes (BRIEF_FRIENDS_TILE_HOLE_SHAPE, section 2).
 *
 * ONE batched read of public.whs_score_holes for the WHOLE rail, keyed on the
 * score_ids the rail already assembles — mirroring useContentReactions in this
 * same folder. NEVER useRoundDetail per card: ten tiles would be ten round
 * trips in a horizontally scrolling rail.
 *
 * USE actual_gross, NOT adjusted_gross. The tile says what happened on the
 * course; adjusted gross is a handicap-computation artefact and would draw a
 * capped score the player never made.
 *
 * SKIP holes where played is false — a member who walked in after fourteen
 * played fourteen holes, and a missing hole is NOT level par.
 *
 * If the table is unreachable the hook reports nothing and every tile falls
 * back to the live three-point curve (the standing absent-renders-the-fallback
 * rule) rather than throwing.
 */

/** Postgres/PostgREST codes for "relation does not exist". */
const MISSING_TABLE = new Set(['42P01', 'PGRST205', 'PGRST204']);

/** Fewer played holes than this and the tile uses the three-point fallback:
 *  a member must never see a half-drawn round. */
const MIN_PLAYED_HOLES = 9;

interface Row {
  score_id: string;
  hole_no: number;
  par: number;
  actual_gross: number | null;
  played: boolean;
}

export type EventKind = 'under' | 'double';

/** A bead on the tile curve. Tone and radius come from the SHARED
 *  beadForScore rule (BRIEF_UNIFY_ROUND_CURVE_BEADS) — the tile no longer has
 *  a rule of its own, so an ace draws gold and an eagle draws larger than a
 *  birdie exactly as it does on the scorecard sheet. */
export interface ShapeBead {
  /** Index into `series` (1-based hole position). */
  i: number;
  tone: string;
  r: number;
}

export interface HoleShape {
  /** Cumulative strokes over par, INCLUDING the leading 0 before the first tee. */
  series: number[];
  /** Beads from the shared rule, positioned on the cumulative value AFTER the hole. */
  beads: ShapeBead[];
  /** Holes actually played. */
  played: number;
  /** Holes under par — the birdie count in the meta row. */
  birdies: number;
}

function buildShape(rows: Row[]): HoleShape | null {
  const holes = rows
    .filter((r) => r.played && r.actual_gross != null && Number.isFinite(r.actual_gross))
    .sort((a, b) => a.hole_no - b.hole_no);
  if (holes.length < MIN_PLAYED_HOLES) return null;

  const series: number[] = [0];
  const beads: ShapeBead[] = [];
  let birdies = 0;
  let cum = 0;
  holes.forEach((h, idx) => {
    const d = (h.actual_gross as number) - h.par;
    cum += d;
    series.push(cum);
    if (d < 0) birdies += 1;
    // ONE RULE, THREE CALLERS. The tile's panel is white, so 'light'.
    const bead = beadForScore(h.actual_gross, h.par, 'light');
    if (bead) beads.push({ i: idx + 1, tone: bead.tone, r: bead.radius });
  });

  return { series, beads, played: holes.length, birdies };
}

export function useRoundHoleShapes(scoreIds: readonly (string | null | undefined)[]) {
  // Stable key: the sorted set of ids in the rail.
  const ids = useMemo(() => {
    const seen = new Set<string>();
    for (const id of scoreIds) if (id) seen.add(id);
    return [...seen].sort();
  }, [scoreIds]);

  const { data } = useQuery<Map<string, HoleShape>>({
    queryKey: ['round-hole-shapes', ids.join(',')],
    enabled: ids.length > 0,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from('whs_score_holes' as never)
        .select('score_id, hole_no, par, actual_gross, played')
        .in('score_id', ids as string[]);
      if (error) {
        if (MISSING_TABLE.has(String((error as { code?: string }).code ?? ''))) {
          console.warn('[hole shapes] whs_score_holes unavailable; tiles use the 3-point curve');
          return new Map();
        }
        throw error;
      }
      const grouped = new Map<string, Row[]>();
      for (const r of (rows ?? []) as unknown as Row[]) {
        const list = grouped.get(r.score_id);
        if (list) list.push(r);
        else grouped.set(r.score_id, [r]);
      }
      const out = new Map<string, HoleShape>();
      for (const [id, list] of grouped) {
        const shape = buildShape(list);
        if (shape) out.set(id, shape);
      }
      return out;
    },
  });

  return data ?? null;
}

export default useRoundHoleShapes;
