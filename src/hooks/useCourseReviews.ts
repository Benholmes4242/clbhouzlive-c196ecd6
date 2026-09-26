import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useBlockedUserIds } from './useBlockedUserIds';

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
  /** True when the viewer has liked this review (content_reactions, target_type
   *  'review'). There is no unhelpful — zero rows ever existed. */
  current_user_vote?: boolean;
  is_mock: boolean;
  // L6 - tee played (optional). May be absent on old reviews.
  tee_label?: string | null;
  user_profiles?: {
    id: string;
    username: string | null;
    display_name: string | null;
    profile_photo_url: string | null;
  } | null;
  course?: {
    id: string;
    name: string | null;
    country: string | null;
    region: string | null;
    sub_country: string | null;
    thumbnail_image: string | null;
  } | null;
  media?: ReviewMediaItem[];
};

export type ReviewsSortBy = 'recent' | 'highest' | 'lowest' | 'helpful';
export type ReviewsRatingFilter = 'all' | '10-9' | '8.9-7.5' | '7.4-5' | '<5';

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
  const blockedIds = useBlockedUserIds(currentUserId);

  return useQuery({
    queryKey: ['course-reviews-full', courseId, sortBy, ratingFilter, filtersKey, blockedIds.size],
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
          tee_label,
          user_profiles:user_id (
            id,
            username,
            display_name,
            profile_photo_url
          ),
          course:golf_courses!course_id (
            id,
            name,
            country,
            region,
            sub_country,
            thumbnail_image
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

      // Rating range filter — aligned with new 5-tier taxonomy
      // Chip ranges: '10-9' (Exceptional), '8.9-7.5' (Excellent), '7.4-5' (Good)
      switch (ratingFilter) {
        case '10-9':
          query = query.gte('rating', 9).lte('rating', 10);
          break;
        case '8.9-7.5':
          query = query.gte('rating', 7.5).lt('rating', 9);
          break;
        case '7.4-5':
          query = query.gte('rating', 5).lt('rating', 7.5);
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
          // helpful_count COUNTS LIKES (content_reactions, target_type 'review'),
          // kept by trg_sync_review_like_count. The name is historical. The sort
          // stays server-side: sorting the fetched 100 would drop a review at 101.
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
      const rawReviews = ((data as any) ?? []).map((review: any) => ({
        ...review,
        is_mock: review.is_mock ?? false,
        media: (review.course_review_media || []).map((m: any) => ({
          ...m,
          media_type: m.media_type as 'image' | 'video',
        })),
      })) as CourseReview[];

      // B3: hide reviews by blocked users (or users blocking me).
      const reviews = blockedIds.size
        ? rawReviews.filter((r) => !blockedIds.has(r.user_id))
        : rawReviews;


      // If user is logged in, fetch their votes for these reviews
      if (currentUserId && reviews.length > 0) {
        const reviewIds = reviews.map((r) => r.id);
        const { data: likes } = await supabase
          .from('content_reactions')
          .select('target_id')
          .eq('user_id', currentUserId)
          .eq('target_type', 'review')
          .in('target_id', reviewIds);

        const liked = new Set((likes ?? []).map((l) => l.target_id as string));

        return reviews.map((review) => ({
          ...review,
          current_user_vote: liked.has(review.id),
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
