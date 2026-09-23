import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PendingReviewRow {
  id: string;
  course_id: string;
  course_name: string;
  course_thumbnail: string | null;
  rating: number | null;
  design_score: number | null;
  condition_score: number | null;
  clubhouse_score: number | null;
  facilities_score: number | null;
  review: string | null;
  verdict: string | null;
  tee_label: string | null;
  share_to_feed: boolean | null;
  media_expected: number;
  effective_status: 'uploading' | 'stale' | 'failed';
  error_message: string | null;
  created_at: string;
}

export function usePendingReviews(userId: string | null | undefined) {
  return useQuery({
    queryKey: ['pending-reviews', userId],
    enabled: !!userId,
    staleTime: 15_000,
    refetchOnWindowFocus: true,
    // A stale pending card is the exact failure this surface exists to prevent.
    refetchOnMount: 'always',
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_pending_reviews' as never);
      if (error) throw error;
      return (data ?? []) as PendingReviewRow[];
    },
  });
}

export function useDiscardPendingReview(userId: string | null | undefined) {
  const qc = useQueryClient();
  return useCallback(
    async (pendingId: string) => {
      const { error } = await supabase.rpc('discard_pending_review' as never, {
        p_pending_id: pendingId,
      } as never);
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ['pending-reviews', userId] });
    },
    [qc, userId],
  );
}
