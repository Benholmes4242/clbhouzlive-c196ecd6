import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * CB106 — the single most recent written review across a club's courses, for
 * the club profile "What golfers say" card. The select is a strict subset of
 * what useCourseReviews already reads on course_ratings (reviewer id,
 * display_name, profile_photo_url plus rating, review, review_date,
 * course_id) — nothing beyond it. Non-mock rows with non-empty text only,
 * newest review_date first.
 */
export interface ClubLatestReview {
  id: string;
  course_id: string;
  user_id: string;
  rating: number | null;
  review: string | null;
  review_date: string | null;
  user_profiles: {
    id: string;
    username: string | null;
    display_name: string | null;
    profile_photo_url: string | null;
  } | null;
}

export function useClubLatestReview(courseIds: string[]) {
  const key = [...courseIds].sort().join(',');
  return useQuery({
    queryKey: ['club-latest-review', key],
    enabled: courseIds.length > 0,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<ClubLatestReview | null> => {
      const { data, error } = await supabase
        .from('course_ratings' as any)
        .select(
          `id, course_id, user_id, rating, review, review_date,
           user_profiles:user_id ( id, username, display_name, profile_photo_url )`,
        )
        .in('course_id', courseIds)
        .eq('is_mock', false)
        .not('review', 'is', null)
        .not('review', 'eq', '')
        .order('review_date', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as ClubLatestReview) ?? null;
    },
  });
}
