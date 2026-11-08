/**
 * usePostGolfContext (PF1B) — ONE batched read of get_post_golf_context for a
 * page of posts, keyed on the sorted de-duplicated id array, called ONCE at
 * page/viewer level and passed down. A card never fetches.
 *
 * The RPC returns only posts that have a hole, tags or an attached round AND
 * that the viewer can see, max 100 ids per call, authenticated only. Guests
 * and the signed-out get NOTHING: the query stays disabled and the map is
 * empty. A failed chunk is skipped, never thrown — a post without context
 * renders exactly as before.
 *
 * Round posts (post_type 'round') are the round already: callers pass their
 * ids in `exclude` and they never reach the RPC.
 */
import { useMemo } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useIsGuest } from '@/features/guest/useIsGuest';
import { fetchCourseTeeSets, COURSE_TEE_SETS_STALE, type TeeHole } from '@/features/courses/hooks/useCourseTeeSets';

/** Server cap on get_post_golf_context's p_post_ids. */
export const GOLF_CONTEXT_BATCH = 100;

export interface PostGolfContext {
  postId: string;
  courseId: string | null;
  holeNo: number | null;
  shotTags: string[];
  roundScoreId: string | null;
  roundGross: number | null;
  roundPar: number | null;
  roundPlayDate: string | null;
  roundHoles: number | null;
  mediaHoles?: Array<{ mediaId: string | null; displayOrder: number | null; holeNo: number | null }>;
}

/** null / undefined / non-finite stays null. Absence is not zero. */
function nullableNum(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function coerce(row: Record<string, unknown>): PostGolfContext {
  return {
    postId: String(row.post_id ?? ''),
    courseId: row.course_id ? String(row.course_id) : null,
    holeNo: nullableNum(row.hole_no),
    shotTags: Array.isArray(row.shot_tags) ? (row.shot_tags as unknown[]).map(String) : [],
    roundScoreId: row.round_score_id ? String(row.round_score_id) : null,
    roundGross: nullableNum(row.round_gross),
    roundPar: nullableNum(row.round_par),
    roundPlayDate: row.round_play_date ? String(row.round_play_date) : null,
    roundHoles: nullableNum(row.round_holes),
    mediaHoles: Array.isArray(row.media_holes) ? row.media_holes.flatMap(value => {
      if (!value || typeof value !== 'object') return [];
      const m = value as Record<string, unknown>;
      return [{ mediaId: m.media_id ? String(m.media_id) : null, displayOrder: nullableNum(m.display_order), holeNo: nullableNum(m.hole_no) }];
    }) : [],
  };
}

/** The attached round's to-par: gross minus the round's par, null when the
 *  par is absent. Never derived from the hole strip. */
export function golfRoundToPar(ctx: Pick<PostGolfContext, 'roundGross' | 'roundPar'>): number | null {
  return ctx.roundGross != null && ctx.roundPar != null ? ctx.roundGross - ctx.roundPar : null;
}

export function usePostGolfContext(
  postIds: readonly string[],
  exclude?: ReadonlySet<string>,
): Map<string, PostGolfContext> | null {
  const isGuest = useIsGuest();
  const { user } = useSupabaseSession();

  const ids = useMemo(() => {
    const seen = new Set<string>();
    for (const id of postIds) if (id && !exclude?.has(id)) seen.add(id);
    return [...seen].sort();
  }, [postIds, exclude]);

  const { data } = useQuery<Map<string, PostGolfContext>>({
    queryKey: ['post-golf-context', ids.join(',')],
    enabled: !!user && !isGuest && ids.length > 0,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const map = new Map<string, PostGolfContext>();
      for (let i = 0; i < ids.length; i += GOLF_CONTEXT_BATCH) {
        const { data, error } = await supabase.rpc('get_post_golf_context', {
          p_post_ids: ids.slice(i, i + GOLF_CONTEXT_BATCH),
        } as never);
        if (error) {
          console.warn('[post-golf-context] read failed; posts render without golf context', error);
          continue;
        }
        for (const row of (data ?? []) as unknown as Record<string, unknown>[]) {
          const ctx = coerce(row);
          if (ctx.postId) map.set(ctx.postId, ctx);
        }
      }
      return map;
    },
  });

  return data ?? null;
}

/** Par/yards for the chip, from the SAME course hole source stage 1 used
 *  (get_course_tee_sets, first tee set — the composer's rule). ONE query per
 *  DISTINCT course on the page, never per post; shares the single-course
 *  hook's cache key so a course already read costs nothing. */
export function usePostGolfHoleMeta(courseIds: readonly string[]): Map<string, TeeHole[]> {
  const ids = useMemo(() => {
    const seen = new Set<string>();
    for (const id of courseIds) if (id) seen.add(id);
    return [...seen].sort();
  }, [courseIds]);

  const queries = useQueries({
    queries: ids.map((id) => ({
      queryKey: ['course-tee-sets', id],
      enabled: true,
      staleTime: COURSE_TEE_SETS_STALE,
      queryFn: () => fetchCourseTeeSets(id),
    })),
  });

  return useMemo(() => {
    const map = new Map<string, TeeHole[]>();
    ids.forEach((id, i) => {
      const sets = queries[i]?.data;
      if (sets?.[0]?.holes?.length) map.set(id, sets[0].holes);
    });
    return map;
  }, [ids, queries]);
}

/** The chip's hole for one post: the tee-set hole matching the context's
 *  hole number, null when the course carries no hole detail. */
export function golfHoleFor(
  ctx: PostGolfContext | null | undefined,
  holeMap: Map<string, TeeHole[]> | null | undefined,
): TeeHole | null {
  if (!ctx?.courseId || ctx.holeNo == null) return null;
  return holeMap?.get(ctx.courseId)?.find((h) => h.hole_no === ctx.holeNo) ?? null;
}

/** PF4: media identity wins over display order, including an explicitly cleared
 * hole. Post-wide legacy context applies only when no per-media rows exist. */
export function mediaHoleNo(ctx: PostGolfContext | null | undefined, item: { id: string; displayOrder?: number } | undefined, slide: number): number | null {
  if (!ctx) return null;
  if (ctx.mediaHoles?.length) {
    if (!item) return null;
    const row = ctx.mediaHoles.find(m => m.mediaId === item.id) ?? ctx.mediaHoles.find(m => m.displayOrder === (item.displayOrder ?? slide));
    return row?.holeNo ?? null;
  }
  return slide === 0 ? ctx.holeNo : null;
}
