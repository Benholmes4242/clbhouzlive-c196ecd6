/**
 * useReviewFallback — On-demand fetch of a review's text + breakdown when the
 * feed row didn't include them.
 *
 * Rationale (parity with clubhouse/get_suggested_feed): several RPCs that feed
 * the fullscreen viewer omit `review_text` and per-category scores from their
 * TABLE(...) shape (get_explore_feed, get_watch_shorts, get_course_media,
 * get_long_form_videos). We keep the sheet universal by lazy-loading the
 * missing columns straight from `course_ratings` whenever the sheet opens
 * without them. Reviews are readable per RLS to authenticated users, so this
 * is a plain SELECT with no elevated privileges.
 *
 * The hook is a no-op when `reviewId` is null, the sheet is closed, or every
 * field is already populated.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ReviewFallbackFields {
  reviewText: string | null;
  breakdown: {
    design: number | null;
    conditions: number | null;
    clubhouse: number | null;
    facilities: number | null;
  } | null;
}

interface Params {
  reviewId?: string | null;
  enabled: boolean;
  hasText: boolean;
  hasBreakdown: boolean;
}

export function useReviewFallback({ reviewId, enabled, hasText, hasBreakdown }: Params) {
  const needsFetch = enabled && !!reviewId && (!hasText || !hasBreakdown);

  return useQuery<ReviewFallbackFields | null>({
    queryKey: ['review-fallback', reviewId],
    enabled: needsFetch,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    queryFn: async () => {
      if (!reviewId) return null;
      // eslint-disable-next-line no-console
      console.debug('[review-fallback] fetching', { reviewId, hasText, hasBreakdown });
      const { data, error } = await supabase
        .from('course_ratings')
        .select('review, design_score, condition_score, clubhouse_score, facilities_score')
        .eq('id', reviewId)
        .maybeSingle();
      if (error) {
        // eslint-disable-next-line no-console
        console.error('[review-fallback] error', error);
        throw error;
      }
      // eslint-disable-next-line no-console
      console.debug('[review-fallback] result', {
        reviewId,
        hasReview: !!data?.review,
        len: data?.review?.length ?? 0,
      });
      if (!data) return null;
      return {
        reviewText: (data.review as string | null) ?? null,
        breakdown: {
          design: data.design_score != null ? Number(data.design_score) : null,
          conditions: data.condition_score != null ? Number(data.condition_score) : null,
          clubhouse: data.clubhouse_score != null ? Number(data.clubhouse_score) : null,
          facilities: data.facilities_score != null ? Number(data.facilities_score) : null,
        },
      };
    },
  });
}
