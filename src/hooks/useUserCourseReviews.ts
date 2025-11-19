import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type UserCourseReview = {
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
  golf_courses: {
    id: string;
    name: string;
    country: string | null;
    sub_country: string | null;
    region: string | null;
  } | null;
};

export type SortBy = 'recent' | 'highest' | 'lowest' | 'helpful';

export function useUserCourseReviews(params: {
  userId?: string;
  limit?: number;
  sortBy?: SortBy;
}) {
  const { userId, limit = 5, sortBy = 'recent' } = params;

  return useQuery<UserCourseReview[]>({
    queryKey: ['user-course-reviews', userId, limit, sortBy],
    enabled: !!userId,
    queryFn: async (): Promise<UserCourseReview[]> => {
      if (!userId) return [];

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
          golf_courses:course_id (
            id,
            name,
            country,
            sub_country,
            region
          )
        `
        )
        .eq('user_id', userId)
        .not('review', 'is', null)
        .not('review', 'eq', '');

      switch (sortBy) {
        case 'highest':
          query = query.order('rating', { ascending: false }).order('review_date', { ascending: false });
          break;
        case 'lowest':
          query = query.order('rating', { ascending: true }).order('review_date', { ascending: false });
          break;
        case 'helpful':
          query = query
            .order('helpful_count', { ascending: false, nullsFirst: false })
            .order('review_date', { ascending: false });
          break;
        case 'recent':
        default:
          query = query.order('review_date', { ascending: false }).order('created_at', { ascending: false });
          break;
      }

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data as any as UserCourseReview[]) || [];
    },
    staleTime: 60_000,
  });
}
