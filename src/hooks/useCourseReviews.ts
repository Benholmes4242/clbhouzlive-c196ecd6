import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ReviewMediaItem {
  id: string;
  media_type: 'image' | 'video';
  media_url: string;
  poster_url?: string | null;
  width?: number | null;
  height?: number | null;
}

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
  unhelpful_count: number | null;
  current_user_vote?: 'helpful' | 'unhelpful' | null;
  is_mock: boolean;
  user_profiles?: {
    id: string;
    username: string | null;
    display_name: string | null;
    profile_photo_url: string | null;
  } | null;
  media?: ReviewMediaItem[];
};

export type ReviewsSortBy = 'recent' | 'highest' | 'lowest' | 'helpful';
export type ReviewsRatingFilter = 'all' | '10-9' | '8-7' | '6-5' | '<5';

export interface ReviewsFilters {
  hasMedia?: boolean;
  hasText?: boolean;
  searchQuery?: string;
  showMock?: boolean;
}

export function useCourseReviews(
  courseId: string | undefined,
  sortBy: ReviewsSortBy = 'recent',
  ratingFilter: ReviewsRatingFilter = 'all',
  filters?: ReviewsFilters,
  currentUserId?: string
) {
  const filtersKey = filters ? JSON.stringify(filters) : 'none';

  return useQuery({
    queryKey: ['course-reviews-full', courseId, sortBy, ratingFilter, filtersKey],
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
          unhelpful_count,
          is_mock,
          user_profiles:user_id (
            id,
            username,
            display_name,
            profile_photo_url
          ),
          course_review_media (
            id,
            media_type,
            media_url,
            poster_url,
            width,
            height
          )
        `
        )
        .eq('course_id', courseId);

      // Filter mock reviews if specified
      if (filters?.showMock === false) {
        query = query.eq('is_mock', false);
      }

      // Search filter
      if (filters?.searchQuery?.trim()) {
        query = query.ilike('review', `%${filters.searchQuery.trim()}%`);
      }

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

      // Additional filters
      if (filters?.hasText) {
        query = query.not('review', 'is', null).not('review', 'eq', '');
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

      // Transform to include media array with proper typing
      const reviews = ((data as any) ?? []).map((review: any) => ({
        ...review,
        is_mock: review.is_mock ?? false,
        media: (review.course_review_media || []).map((m: any) => ({
          ...m,
          media_type: m.media_type as 'image' | 'video',
        })),
      })) as CourseReview[];

      // If user is logged in, fetch their votes for these reviews
      if (currentUserId && reviews.length > 0) {
        const reviewIds = reviews.map((r) => r.id);
        const { data: votes } = await supabase
          .from('course_review_votes')
          .select('rating_id, vote_type')
          .eq('user_id', currentUserId)
          .in('rating_id', reviewIds);

        // Map votes to reviews
        const voteMap = new Map(
          votes?.map((v) => [v.rating_id, v.vote_type as 'helpful' | 'unhelpful']) ?? []
        );

        return reviews.map((review) => ({
          ...review,
          current_user_vote: voteMap.get(review.id) ?? null,
        }));
      }

      return reviews;
    },
    // 5 minute staleTime for other users' data - user's own data uses optimistic updates
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
