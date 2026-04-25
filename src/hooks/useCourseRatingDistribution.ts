import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getScoreTier } from '@/utils/getScoreTier';
import { RatingTierDistributionData } from '@/components/courses/review/RatingTierDistribution';
import { SHOW_MOCK_REVIEWS } from '@/features/courses/config';

/**
 * Fetches rating distribution for a course by tier bucket.
 * Uses the same Global Colour System tier logic as the rest of the app.
 */
export function useCourseRatingDistribution(courseId: string | undefined) {
  return useQuery({
    queryKey: ['course-rating-distribution', courseId, SHOW_MOCK_REVIEWS],
    enabled: !!courseId,
    queryFn: async (): Promise<RatingTierDistributionData> => {
      if (!courseId) {
        return { exceptional: 0, outstanding: 0, excellent: 0, veryGood: 0, good: 0, fair: 0 };
      }

      let query = supabase
        .from('course_ratings')
        .select('rating')
        .eq('course_id', courseId);

      // When mock reviews are disabled, only show real reviews
      if (!SHOW_MOCK_REVIEWS) {
        query = query.eq('is_mock', false);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Calculate distribution using unified tier system
      const dist: RatingTierDistributionData = { 
        exceptional: 0,
        outstanding: 0, 
        excellent: 0, 
        veryGood: 0, 
        good: 0, 
        fair: 0 
      };

      (data || []).forEach((r: { rating: number }) => {
        const tierData = getScoreTier(r.rating);
        dist[tierData.tier]++;
      });

      return dist;
    },
    staleTime: 30 * 60 * 1000, // 30 min – same as aggregates
    gcTime: 60 * 60 * 1000,    // 60 min
    refetchOnWindowFocus: false,
  });
}
