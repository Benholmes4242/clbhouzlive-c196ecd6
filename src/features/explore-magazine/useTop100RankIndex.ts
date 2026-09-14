import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';

/**
 * THE RANK SCOPE IS READ, NEVER INFERRED.
 *
 * The Explore surfaces used to derive a rank's scope from the ABSENCE of a world
 * rank — `world != null ? 'world' : 'GB&I'` — which labelled every non-world
 * course GB&I regardless of where on earth it is (Pine Valley, New Jersey, read
 * "#1 GB&I"). Worse, the world detection itself looked for a list slug that does
 * not exist in `top100_lists` (`top-100-worldwide`; the real slug is `global`),
 * so the world branch never fired at all and the Continental Europe list — 100
 * courses — had no way to be expressed.
 *
 * THE CHIP NAMES THE LIST THE RANK CAME FROM. There are exactly four active
 * lists, 100 courses each, so the whole rank table is ~400 rows: it is read ONCE
 * here and shared by every caller through the query cache, rather than each card
 * asking for its own course.
 *
 * REGIONAL FIRST. A course on both USA and Global reads "#1 USA" — the more
 * specific claim. Global is the FALLBACK, used only where no regional list
 * covers the course. When no membership resolves, callers show the rank with NO
 * scope label; a wrong scope is worse than no scope.
 */

export type RankListSlug = 'global' | 'gb-i' | 'usa' | 'europe';

/** THE LIST'S OWN NAME, shortened only as far as the chip allows. Nothing is
 *  truncated mid-word: "Britain & Ireland" -> "GB&I" (the app-wide short form,
 *  see constants/courseRegions), "Continental Europe" -> "Europe". */
export const RANK_SCOPE_LABEL: Record<RankListSlug, string> = {
  global: 'Global',
  'gb-i': 'GB&I',
  usa: 'USA',
  europe: 'Europe',
};

/** Regional beats global; between regionals the lower rank wins (a course cannot
 *  sit on two regional lists in the published data, so this is only a tiebreak
 *  that can never read as an invented scope). */
const PRIORITY: Record<RankListSlug, number> = { 'gb-i': 0, usa: 0, europe: 0, global: 1 };

export interface CourseRankStanding {
  rank: number;
  scope: RankListSlug;
}

export type Top100RankIndex = Map<string, CourseRankStanding>;

function isRankSlug(slug: string): slug is RankListSlug {
  return slug === 'global' || slug === 'gb-i' || slug === 'usa' || slug === 'europe';
}

export function useTop100RankIndex(enabled = true) {
  const query = useQuery<Top100RankIndex>({
    queryKey: ['top100-rank-index'],
    enabled,
    staleTime: 60 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_top100_memberships')
        .select('course_id, rank, top100_lists!inner(slug, is_active)')
        .limit(2000);
      if (error) throw error;

      const out: Top100RankIndex = new Map();
      for (const row of (data ?? []) as Array<{
        course_id: string;
        rank: number | null;
        top100_lists: { slug: string; is_active: boolean } | null;
      }>) {
        const slug = row.top100_lists?.slug;
        if (!slug || !isRankSlug(slug)) continue;
        if (row.top100_lists?.is_active === false || row.rank == null) continue;
        const existing = out.get(row.course_id);
        if (existing) {
          const better =
            PRIORITY[slug] < PRIORITY[existing.scope] ||
            (PRIORITY[slug] === PRIORITY[existing.scope] && row.rank < existing.rank);
          if (!better) continue;
        }
        out.set(row.course_id, { rank: row.rank, scope: slug });
      }
      return out;
    },
  });

  return { index: query.data ?? null, isFetched: !enabled ? true : query.isFetched };
}
