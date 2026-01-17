/**
 * useReviewsOfTheWeek - Fetches top video reviews for the "Reviews of the Week" carousel
 * 
 * Uses engagement score (likes * 3 + comments * 2) with recency boost
 * Falls back from 7 days to 30 days if not enough reviews
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ReviewOfTheWeek {
  post_id: string;
  review_id: string;
  video_url: string;
  thumbnail_url: string | null;
  aspect_ratio: number | null;
  rating: number;
  review_text: string;
  review_snippet: string;
  created_at: string;
  course_id: string;
  course_name: string;
  course_location: string;
  course_slug: string | null;
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  likes_count: number;
  comments_count: number;
  engagement_score: number;
}

interface UseReviewsOfTheWeekOptions {
  limit?: number;
  weekFallbackToMonth?: boolean;
}

export function useReviewsOfTheWeek(options: UseReviewsOfTheWeekOptions = {}) {
  const { limit = 7, weekFallbackToMonth = true } = options;
  
  return useQuery({
    queryKey: ['reviews-of-the-week', limit, weekFallbackToMonth],
    queryFn: async (): Promise<ReviewOfTheWeek[]> => {
      // Try last 7 days first
      const { data: reviews, error } = await supabase
        .rpc('get_top_video_reviews', {
          days_back: 7,
          result_limit: limit,
        });
      
      if (error) {
        console.error('[useReviewsOfTheWeek] Error fetching reviews:', error);
        throw error;
      }
      
      // Fallback to 30 days if not enough reviews
      if (weekFallbackToMonth && (!reviews || reviews.length < 3)) {
        console.log('[useReviewsOfTheWeek] Falling back to 30 days');
        const { data: monthReviews, error: monthError } = await supabase
          .rpc('get_top_video_reviews', {
            days_back: 30,
            result_limit: limit,
          });
        
        if (monthError) {
          console.error('[useReviewsOfTheWeek] Error fetching month reviews:', monthError);
          throw monthError;
        }
        
        console.log(`[useReviewsOfTheWeek] Found ${monthReviews?.length || 0} reviews (30 days)`);
        return (monthReviews || []) as ReviewOfTheWeek[];
      }
      
      console.log(`[useReviewsOfTheWeek] Found ${reviews?.length || 0} reviews (7 days)`);
      return (reviews || []) as ReviewOfTheWeek[];
    },
    staleTime: 5 * 60 * 1000,  // 5 minutes
    gcTime: 30 * 60 * 1000,    // 30 minutes
  });
}

export default useReviewsOfTheWeek;
