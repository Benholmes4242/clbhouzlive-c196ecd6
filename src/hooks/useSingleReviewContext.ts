/** REVIEWS_STATE_2: read only existing, RLS-visible rater facts. No review-date
 * or round-date proxy for a review's played month. Counts use stable paginated
 * non-mock ratings and exact tracked-round counts, never a capped list length.
 * Each unavailable read stays unknown independently; it is not a zero.
 * The course-reviews-full prefix preserves existing review invalidation. */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { resolveDisplayHandicap } from '@/lib/handicap/resolveHandicap';
import { raterHistory, type RaterContext } from '@/lib/reviews/singleReview';

export async function fetchSingleReviewContext(userId: string, courseId: string): Promise<RaterContext> {
  const profileRead = supabase.from('user_profiles')
    .select('eg_handicap_index, manual_handicap_index, eg_app_connected, gender').eq('id', userId).maybeSingle();
  const roundsRead = supabase.from('gam_round_stats').select('whs_score_id', { count: 'exact', head: true })
    .eq('user_id', userId).eq('course_id', courseId);
  const historyRead = async () => {
    const rows: { course_id: string; rating: number }[] = [];
    for (let offset = 0; ; offset += 500) {
      const { data, error } = await supabase.from('course_ratings').select('id, course_id, rating')
        .eq('user_id', userId).eq('is_mock', false).not('rating', 'is', null)
        .order('id', { ascending: true }).range(offset, offset + 499);
      if (error) throw error;
      const page = data ?? [];
      rows.push(...page);
      if (page.length < 500) return raterHistory(rows);
    }
  };
  const [profileResult, roundsResult, historyResult] = await Promise.allSettled([profileRead, roundsRead, historyRead()]);
  const profile = profileResult.status === 'fulfilled' && !profileResult.value.error ? profileResult.value.data : null;
  const rounds = roundsResult.status === 'fulfilled' && !roundsResult.value.error ? roundsResult.value.count : null;
  const history = historyResult.status === 'fulfilled' ? historyResult.value : null;
  return {
    handicap: profile && typeof profile.eg_app_connected === 'boolean' ? resolveDisplayHandicap({
      egHandicapIndex: profile.eg_handicap_index, manualHandicapIndex: profile.manual_handicap_index,
      hasWhsConnection: profile.eg_app_connected,
    }).value : null,
    gender: profile?.gender ?? null,
    roundsHere: rounds ?? null,
    coursesRated: history?.coursesRated ?? null,
    perfectTens: history?.perfectTens ?? null,
  };
}

export function useSingleReviewContext(userId: string | undefined, courseId: string) {
  return useQuery({
    queryKey: ['course-reviews-full', courseId, 'single-rater-context', userId],
    enabled: Boolean(userId && courseId),
    queryFn: () => userId ? fetchSingleReviewContext(userId, courseId) : null,
    staleTime: 5 * 60 * 1000,
  });
}