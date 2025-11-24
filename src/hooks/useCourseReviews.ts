import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type CourseReview = {
  id: string;
  course_id: string;
  user_id: string;
  rating: number | null;
  design_score: number | null;
  condition_score: number | null;
  clubhouse_score: number | null;
  facilities_score: number | null;
  review: string | null;
  review_date: string | null;
  helpful_count: number | null;
  user_profiles?: {
    id: string;
    username: string | null;
    display_name: string | null;
    profile_photo_url: string | null;
  } | null;
};

export type ReviewsSortBy = 'recent' | 'highest' | 'lowest' | 'helpful';
export type ReviewsRatingFilter = 'all' | '10-9' | '8-7' | '6-5' | '<5';

export function useCourseReviews(
  courseId: string | undefined,
  sortBy: ReviewsSortBy,
  ratingFilter: ReviewsRatingFilter
) {
  return useQuery({
    queryKey: ['course-reviews-full', courseId, sortBy, ratingFilter],
    enabled: Boolean(courseId),
    queryFn: async (): Promise<CourseReview[]> => {
      if (!courseId) return [];

      let query = supabase
        .from('course_ratings' as any)
        .select(
          `
          id,
          course_id,
          user_id,
          rating,
          design_score,
          condition_score,
          clubhouse_score,
          facilities_score,
          review,
          review_date,
          helpful_count,
          user_profiles:user_id (
            id,
            username,
            display_name,
            profile_photo_url
          )
        `
        )
        .eq('course_id', courseId)
        .not('review', 'is', null)
        .not('review', 'eq', '');

      // Rating range filter
      switch (ratingFilter) {
        case '10-9':
          query = query.gte('rating', 9).lte('rating', 10);
          break;
        case '8-7':
          query = query.gte('rating', 7).lt('rating', 9);
          break;
        case '6-5':
          query = query.gte('rating', 5).lt('rating', 7);
          break;
        case '<5':
          query = query.lt('rating', 5);
          break;
        case 'all':
        default:
          break;
      }

      // Sorting
      switch (sortBy) {
        case 'highest':
          query = query.order('rating', { ascending: false }).order('review_date', {
            ascending: false,
          });
          break;
        case 'lowest':
          query = query.order('rating', { ascending: true }).order('review_date', {
            ascending: false,
          });
          break;
        case 'helpful':
          query = query
            .order('helpful_count', { ascending: false, nullsFirst: false })
            .order('review_date', { ascending: false });
          break;
        case 'recent':
        default:
          query = query.order('review_date', { ascending: false });
          break;
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;

      return (data as any as CourseReview[]) ?? [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}
