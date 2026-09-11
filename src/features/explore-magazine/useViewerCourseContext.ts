import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';

/**
 * WHAT THE VIEWER ALREADY HAS AN OPINION ABOUT (BRIEF_EXPLORE_MAGAZINE §6b).
 *
 * The consequences Phase A can derive honestly all come from two viewer-owned
 * sets: the courses they have RATED (review_disagree carries theirs and yours)
 * and the courses on their LIST (review_on_list, list_new_low, and the "On your
 * list" kicker). Neither needs standing, so neither waits for Phase B.
 *
 * VIEWER-SCOPED KEY. Both reads are answers about one member, so the viewer id
 * is in the key — a disabled read is still a cache read.
 */

export interface ViewerCourseContext {
  /** course_id -> the viewer's own rating out of 10. */
  ratings: Map<string, number>;
  /** course_id set: want-to-play / wishlist. */
  shortlist: Set<string>;
}

const EMPTY: ViewerCourseContext = { ratings: new Map(), shortlist: new Set() };

export function useViewerCourseContext(viewerId: string | undefined) {
  const query = useQuery<ViewerCourseContext>({
    queryKey: ['explore-magazine', 'viewer-course-context', viewerId ?? 'anon'],
    enabled: !!viewerId,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const [rated, listed] = await Promise.all([
        supabase.from('course_ratings').select('course_id, rating').eq('user_id', viewerId as string),
        supabase.from('course_shortlists').select('course_id, list_key').eq('user_id', viewerId as string),
      ]);
      if (rated.error) throw rated.error;
      if (listed.error) throw listed.error;

      const ratings = new Map<string, number>();
      for (const row of (rated.data ?? []) as Array<{ course_id: string | null; rating: number | null }>) {
        if (row.course_id && row.rating != null) ratings.set(row.course_id, Number(row.rating));
      }
      const shortlist = new Set<string>();
      for (const row of (listed.data ?? []) as Array<{ course_id: string | null; list_key: string | null }>) {
        const key = (row.list_key ?? 'want_to_play').toLowerCase();
        if (row.course_id && (key === 'want_to_play' || key === 'wishlist')) shortlist.add(row.course_id);
      }
      return { ratings, shortlist };
    },
  });

  return {
    /* A DISABLED QUERY REPORTS isLoading FALSE, so readiness is isFetched and
       never isLoading (§0). A signed-out viewer is READY with an empty context. */
    context: query.data ?? EMPTY,
    isFetched: viewerId ? query.isFetched : true,
  };
}
