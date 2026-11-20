/**
 * Own review media and one course_ratings batch supply canonical review pages.
 * This hook produces no post moments; engagement is read by the review viewer.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from './useSupabaseSession';
import type { ReviewFeedPostInput } from '@/lib/reviews/reviewFeedPost';
import { usablePoster } from '@/features/review-v2/lib/persistedPoster';

export interface CourseMoment {
  id: string;
  type: 'post' | 'review_media';
  mediaUrl: string;
  mediaType: 'image' | 'video';
  posterUrl?: string;
  createdAt: string;
  caption?: string;
  reviewId?: string;
  reviewInput?: Omit<ReviewFeedPostInput, 'media' | 'courseName'>;
}

export function useUserCourseMoments(courseId: string | undefined) {
  const { user } = useSupabaseSession();

  return useQuery({
    queryKey: ['user-course-moments', courseId, user?.id],
    enabled: !!courseId && !!user?.id,
    queryFn: async (): Promise<CourseMoment[]> => {
      if (!courseId || !user?.id) return [];

      const moments: CourseMoment[] = [];

      // Filter by course_id through the rating relationship
      const { data: userRatings, error: ratingsError } = await supabase
        .from('course_ratings')
        .select('id, user_id, course_id, rating, review, created_at, design_score, condition_score, clubhouse_score, facilities_score')
        .eq('course_id', courseId)
        .eq('user_id', user.id);
      if (ratingsError) throw ratingsError;
      const ratingIds = new Set(userRatings?.map(r => r.id) ?? []);
      if (!ratingIds.size) return [];

      // Get media for those ratings
      const { data: courseMedia, error: mediaError } = await supabase
        .from('course_review_media')
        .select('id, media_url, media_type, poster_url, created_at, review_id')
        .in('review_id', Array.from(ratingIds));
      if (mediaError) throw mediaError;
      const ratings = new Map(userRatings?.map(row => [row.id, row]));

      courseMedia?.forEach(media => {
        const rating = ratings.get(media.review_id);
        if (!rating) return;
        moments.push({
          id: media.id,
          type: 'review_media',
          mediaUrl: media.media_url,
          mediaType: media.media_type === 'video' ? 'video' : 'image',
          posterUrl: usablePoster(media.poster_url) ?? undefined,
          createdAt: media.created_at,
          reviewId: media.review_id,
          reviewInput: {
            reviewId: rating.id, userId: rating.user_id, courseId: rating.course_id,
            rating: rating.rating, text: rating.review, createdAt: rating.created_at,
            breakdown: { design: rating.design_score, conditions: rating.condition_score,
              clubhouse: rating.clubhouse_score, facilities: rating.facilities_score },
          },
        });
      });

      // Sort by date, newest first
      return moments.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    },
    staleTime: 5 * 60 * 1000,
  });
}
