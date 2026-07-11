// usePopularCourses — top 10 golf courses worldwide by community score.
//
// Ranking source: get_course_leaderboard RPC (p_sort_by='rating'), the same
// path Explore's Highest Rated + Course Leaderboard use. It applies the
// platform-wide min ratings-count floor, so a rewrite to monthly trending
// only needs to swap p_time_period below.
//
// When excludeReviewedForUserId is set (review flow), courses the user has
// already reviewed are filtered out and the query fetches a wider page to
// keep the visible count at LIMIT.

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PopularCourse {
  id: string;
  name: string;
  country: string | null;
  sub_country: string | null;
}

const LIMIT = 10;

export function usePopularCourses(
  open: boolean,
  opts: { excludeReviewedForUserId?: string | null } = {},
) {
  const { excludeReviewedForUserId = null } = opts;
  const [rows, setRows] = useState<PopularCourse[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoaded(false);
    (async () => {
      // If we need to exclude, pull a larger page so the trimmed list still hits LIMIT.
      const fetchSize = excludeReviewedForUserId ? LIMIT + 20 : LIMIT;

      const [{ data, error }, reviewedRes] = await Promise.all([
        supabase.rpc('get_course_leaderboard', {
          p_sort_by: 'rating',
          p_sort_order: 'desc',
          p_time_period: 'all_time',
          p_current_user_id: null,
          p_limit: fetchSize,
          p_offset: 0,
          p_country: null,
          p_sub_country: null,
          p_exclude_countries: null,
        } as any),
        excludeReviewedForUserId
          ? supabase
              .from('course_ratings')
              .select('course_id')
              .eq('user_id', excludeReviewedForUserId)
          : Promise.resolve({ data: [] as Array<{ course_id: string | null }> }),
      ]);
      if (cancelled) return;
      if (error) { setRows([]); setLoaded(true); return; }

      const reviewed = new Set(
        ((reviewedRes as any).data ?? [])
          .map((r: { course_id: string | null }) => r.course_id)
          .filter((v: string | null): v is string => !!v),
      );

      const list: PopularCourse[] = [];
      for (const r of (data ?? []) as Array<{
        course_id: string;
        course_name: string;
        country: string | null;
        region: string | null;
      }>) {
        if (excludeReviewedForUserId && reviewed.has(r.course_id)) continue;
        list.push({
          id: r.course_id,
          name: r.course_name,
          country: r.country ?? null,
          sub_country: r.region ?? null,
        });
        if (list.length >= LIMIT) break;
      }
      setRows(list);
      setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [open, excludeReviewedForUserId]);

  return { rows, loaded };
}
