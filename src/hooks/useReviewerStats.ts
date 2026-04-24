import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ReviewerStats {
  coursesRated: number;
  /** Null when user has rated < 3 courses (avoids misleading single-rating averages). */
  averageRating: number | null;
  /** Year of the user's first rating, e.g. "2024". Null when they have none. */
  memberSince: string | null;
}

const MIN_RATINGS_FOR_AVG = 3;

/**
 * Fetches per-user reviewer stats: total courses rated, average rating,
 * and year of first review.
 *
 * Returns null while loading / on error / for users with no ratings.
 *
 * - Cached 5min staleTime, 10min gcTime.
 * - Pass `userId='preview'` or `undefined` / `null` to disable (no fetch).
 * - Average is omitted (null) when `coursesRated < 3` to avoid misleading
 *   "Avg 4.2 from 1 review" displays.
 *
 * Cache key: `['reviewer-stats', userId]` — invalidated by
 * `invalidateCourseRatingCaches` after any rating mutation.
 */
export function useReviewerStats(userId: string | null | undefined) {
  return useQuery({
    queryKey: ['reviewer-stats', userId],
    enabled: !!userId && userId !== 'preview',
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    queryFn: async (): Promise<ReviewerStats | null> => {
      if (!userId) return null;
      const { data, error } = await supabase.rpc('get_reviewer_stats', {
        p_user_id: userId,
      });
      if (error) {
        console.warn('[useReviewerStats]', error);
        return null;
      }
      const row = Array.isArray(data) ? data[0] : data;
      if (!row || row.courses_rated == null) return null;
      const coursesRated = Number(row.courses_rated) || 0;
      if (coursesRated === 0) return null;
      const rawAvg = row.avg_rating != null ? Number(row.avg_rating) : null;
      return {
        coursesRated,
        averageRating:
          rawAvg != null && coursesRated >= MIN_RATINGS_FOR_AVG ? rawAvg : null,
        memberSince: row.member_since ? String(row.member_since) : null,
      };
    },
  });
}
