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
  /**
   * BRIEF_ROUND_SHEET §1.3 — READ, BUT NOT DRAWN.
   *
   * The tile curve still uses actual_gross: it says what happened on the course
   * (see the note at the top of this file). The SHEET, however, prints
   * `adjusted_gross ?? actual_gross`, so a seed built from this hook must use
   * that rule or the number would change under the member when the fetch lands.
   * It is carried alongside, never substituted into the curve.
   */
  adjusted_gross: number | null;
  played: boolean;
}

/** §1(a) — the stored round par, already NULL on an incomplete card. */
interface ParRow {
  whs_score_id: string;
  course_par: number | null;
}

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
  /**
   * BRIEF_ROUND_SHAPE_CARRIES_PAR §1 — THE ROUND PAR, READ, NOT DERIVED AGAIN.
   *
   * public.gam_round_stats.course_par for this score, read in the SAME batch as
   * the hole rows. It is already stored under the completeness rule, so it is
   * NULL on an incomplete card by construction — the preview, Discover and the
   * settled sheet therefore agree without any of them summing pars.
   *
   * NULL means NO round par and NO round to-par. Never substitute a sum of the
   * played rows, never default the declared length to eighteen.
   */
  coursePar: number | null;
  /** Cumulative strokes over par, INCLUDING the leading 0 before the first tee. */
  series: number[];
  /** Beads from the shared rule, positioned on the cumulative value AFTER the hole. */
  beads: ShapeBead[];
  /** Holes actually played. */
  played: number;
  /** Holes under par — the birdie count in the meta row. */
  birdies: number;
  /**
   * The raw played holes in TrajectoryLine's shape, so the rail can render THE
   * SAME component the Clubhouse scorecard post and the scorecard sheet use
   * instead of a look-alike of its own.
   */
  holes: {
    holeNo: number;
    par: number | null;
    strokes: number | null;
    /** §1.3 — the sheet's rule: adjusted_gross ?? actual_gross. */
    sheetStrokes: number | null;
  }[];
}

/** THE CURVE DOES NOT CHANGE (§2): the played filter, MIN_PLAYED_HOLES and
 *  actual_gross are untouched. The round par is attached BESIDE the shape. */
function buildShape(rows: Row[]): Omit<HoleShape, 'coursePar'> | null {
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

  return {
    series,
    beads,
    played: holes.length,
    birdies,
    holes: holes.map((h) => ({
      holeNo: h.hole_no,
      par: h.par,
      strokes: h.actual_gross,
      sheetStrokes: h.adjusted_gross ?? h.actual_gross ?? null,
    })),
  };
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
      /* TWO batched reads for the WHOLE rail, keyed on the SAME ids — never a
         per-card round trip. §1(a): the par is READ from gam_round_stats. */
      const [holesRes, parsRes] = await Promise.all([
        supabase
          .from('whs_score_holes' as never)
          .select('score_id, hole_no, par, actual_gross, adjusted_gross, played')
          .in('score_id', ids as string[]),
        supabase
          .from('gam_round_stats' as never)
          .select('whs_score_id, course_par')
          .in('whs_score_id', ids as string[]),
      ]);
      const { data: rows, error } = holesRes;
      if (error) {
        if (MISSING_TABLE.has(String((error as { code?: string }).code ?? ''))) {
          console.warn('[hole shapes] whs_score_holes unavailable; tiles use the 3-point curve');
          return new Map();
        }
        throw error;
      }
      /* An unreadable or absent stats row leaves the par NULL — the honest
         answer. It NEVER throws and never blocks the curve. */
      const parById = new Map<string, number | null>();
      if (parsRes.error) {
        console.warn('[hole shapes] gam_round_stats unavailable; tiles show no round par');
      } else {
        for (const r of (parsRes.data ?? []) as unknown as ParRow[]) {
          const par = Number(r.course_par);
          parById.set(r.whs_score_id, Number.isFinite(par) && par > 0 ? par : null);
        }
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
        if (shape) out.set(id, { ...shape, coursePar: parById.get(id) ?? null });
      }
      return out;
    },
  });

  return data ?? null;
}

export default useRoundHoleShapes;
