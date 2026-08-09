/**
 * useReviewMedia — the photo strip behind ReviewBottomSheet.
 *
 * WHY A READ AND NOT A PROP: BRIEF_SHEET_CAPS_ATW_AND_REVIEW §3c assumed the
 * tapped tile already holds the media array. It does not — useLatestReviews
 * collapses course_review_media down to a SINGLE cover (mediaUrl/mediaType/
 * posterUrl), and the feed RPC callers (Clubhouse, fullscreen viewer, course
 * reviews tab) carry no media at all. So the sheet reads the rows itself,
 * gated on `open`, and skips the read entirely when a caller does supply them.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ReviewMediaItem {
  id: string;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  posterUrl: string | null;
  isCover: boolean;
}

export function useReviewMedia(reviewId: string | null | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ['review-media', reviewId],
    enabled: !!reviewId && enabled,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<ReviewMediaItem[]> => {
      const { data, error } = await supabase
        .from('course_review_media' as any)
        .select('id, media_type, media_url, poster_url, is_cover, created_at')
        .eq('review_id', reviewId as string)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return ((data ?? []) as any[])
        .filter((m) => !!m.media_url)
        .map((m) => ({
          id: String(m.id),
          mediaType: String(m.media_type ?? '').toLowerCase().includes('video')
            ? ('video' as const)
            : ('image' as const),
          mediaUrl: String(m.media_url),
          posterUrl: m.poster_url ?? null,
          isCover: !!m.is_cover,
        }))
        .sort((a, b) => Number(b.isCover) - Number(a.isCover));
    },
  });
}
