/**
 * useReviewReceipt - single RPC behind the review confirmation screen.
 * The client makes no other query for that screen.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ReviewReceipt {
  course_id: string;
  course_name: string;
  region: string | null;
  your_overall: number | null;
  your_design: number | null;
  your_condition: number | null;
  your_clubhouse: number | null;
  your_facilities: number | null;
  community_avg: number | null;
  rating_count: number | null;
  avg_before: number | null;
  unlocked_subscores: boolean | null;
  top100_rank: number | null;
  top100_list: string | null;
  your_rated_in_list: number | null;
  your_rank_of_rated: number | null;
  your_total_rated: number | null;
  next_course_id: string | null;
  next_course_name: string | null;
  next_played_at: string | null;
  unrated_count: number | null;
}

export function useReviewReceipt(ratingId: string | null | undefined) {
  return useQuery({
    queryKey: ['review-receipt', ratingId],
    enabled: !!ratingId,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)('get_review_receipt', {
        p_rating_id: ratingId,
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return (row ?? null) as ReviewReceipt | null;
    },
  });
}
