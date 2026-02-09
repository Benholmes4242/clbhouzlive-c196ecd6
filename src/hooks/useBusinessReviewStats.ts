import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

function average(items: any[], key: string): number | null {
  const valid = items.filter(r => r[key] != null);
  if (!valid.length) return null;
  return Math.round((valid.reduce((sum, r) => sum + r[key], 0) / valid.length) * 10) / 10;
}

export interface BusinessReviewStats {
  totalReviews: number;
  avgRating: number;
  distribution: Array<{ score: number; count: number }>;
  subRatings: {
    design: number | null;
    condition: number | null;
    facilities: number | null;
    clubhouse: number | null;
  };
  recentReviews: number;
  reviewTrend: number;
  unrespondedCount: number;
  courses: Array<{
    id: string;
    name: string;
    avgRating: number;
    reviewCount: number;
    recentCount: number;
  }>;
}

export function useBusinessReviewStats(businessId: string | undefined) {
  return useQuery({
    queryKey: ['business-review-stats', businessId],
    enabled: !!businessId,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<BusinessReviewStats | null> => {
      if (!businessId) return null;

      // Get business's club_id
      const { data: business } = await supabase
        .from('business_accounts')
        .select('club_id')
        .eq('id', businessId)
        .single();

      if (!business?.club_id) return null;

      // Get all courses for this club
      const { data: courses } = await supabase
        .from('golf_courses')
        .select('id, name')
        .eq('club_id', business.club_id);

      if (!courses?.length) return null;

      const courseIds = courses.map(c => c.id);

      // Get all ratings for these courses
      const { data: ratings } = await supabase
        .from('course_ratings')
        .select('course_id, rating, design_score, condition_score, facilities_score, clubhouse_score, created_at')
        .in('course_id', courseIds)
        .eq('is_mock', false);

      if (!ratings?.length) return null;

      const totalReviews = ratings.length;
      const avgRating = Math.round((ratings.reduce((sum, r) => sum + r.rating, 0) / totalReviews) * 10) / 10;

      // Distribution (1-10 scale)
      const distribution = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(score => ({
        score,
        count: ratings.filter(r => Math.round(r.rating) === score).length,
      }));

      // Sub-rating averages
      const subRatings = {
        design: average(ratings, 'design_score'),
        condition: average(ratings, 'condition_score'),
        facilities: average(ratings, 'facilities_score'),
        clubhouse: average(ratings, 'clubhouse_score'),
      };

      // Trend: last 30 days vs previous 30 days
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

      const recentReviews = ratings.filter(r => new Date(r.created_at) >= thirtyDaysAgo).length;
      const previousReviews = ratings.filter(r =>
        new Date(r.created_at) >= sixtyDaysAgo && new Date(r.created_at) < thirtyDaysAgo
      ).length;

      const reviewTrend = previousReviews > 0
        ? Math.round(((recentReviews - previousReviews) / previousReviews) * 100)
        : recentReviews > 0 ? 100 : 0;

      // Per-course breakdown
      const coursesStats = courses.map(c => {
        const courseRatings = ratings.filter(r => r.course_id === c.id);
        const courseAvg = courseRatings.length > 0
          ? Math.round((courseRatings.reduce((sum, r) => sum + r.rating, 0) / courseRatings.length) * 10) / 10
          : 0;
        const courseRecent = courseRatings.filter(r => new Date(r.created_at) >= thirtyDaysAgo).length;
        return {
          id: c.id,
          name: c.name,
          avgRating: courseAvg,
          reviewCount: courseRatings.length,
          recentCount: courseRecent,
        };
      }).sort((a, b) => b.reviewCount - a.reviewCount);

      // Count unresponded reviews
      const { count: respondedCount } = await supabase
        .from('review_responses')
        .select('review_id', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .eq('is_deleted', false);

      const unrespondedCount = Math.max(0, totalReviews - (respondedCount || 0));

      return {
        totalReviews,
        avgRating,
        distribution,
        subRatings,
        recentReviews,
        reviewTrend,
        unrespondedCount,
        courses: coursesStats,
      };
    },
  });
}
