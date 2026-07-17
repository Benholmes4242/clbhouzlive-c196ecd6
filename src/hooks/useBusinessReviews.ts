import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { toast } from '@/lib/toast';

export type BusinessReviewFilter = 'all' | 'unreplied' | 'replied';
export type BusinessReviewSort = 'recent' | 'lowest' | 'highest';

export interface BusinessReviewReviewer {
  id: string;
  display_name: string | null;
  username: string | null;
  profile_photo_url: string | null;
  handicap: number | null;
}

export interface BusinessReviewResponse {
  id: string;
  response_text: string;
  responded_by: string;
  created_at: string;
  updated_at: string | null;
}

export interface BusinessReview {
  id: string;
  rating: number;
  review: string | null;
  title: string | null;
  review_date: string;
  design_score: number | null;
  condition_score: number | null;
  facilities_score: number | null;
  course_id: string;
  course_name: string;
  reviewer: BusinessReviewReviewer;
  response: BusinessReviewResponse | null;
  has_media: boolean;
}

export interface BusinessReviewsSummary {
  count: number;
  avg: number | null;
  awaiting_reply: number;
  reply_rate: number;
  this_period: number;
  distribution: Array<{ bucket: number; count: number }>;
}

export interface BusinessReviewsResult {
  reviews: BusinessReview[];
  summary: BusinessReviewsSummary;
}

interface UseBusinessReviewsOpts {
  filter?: BusinessReviewFilter;
  sort?: BusinessReviewSort;
  limit?: number;
}

const EMPTY_SUMMARY: BusinessReviewsSummary = {
  count: 0,
  avg: null,
  awaiting_reply: 0,
  reply_rate: 0,
  this_period: 0,
  distribution: [1, 2, 3, 4, 5].map((b) => ({ bucket: b, count: 0 })),
};

function normalizeSummary(raw: any): BusinessReviewsSummary {
  if (!raw) return EMPTY_SUMMARY;
  const dist = Array.isArray(raw.distribution) ? raw.distribution : [];
  // Ensure 5 buckets always present
  const byBucket = new Map<number, number>();
  dist.forEach((d: any) => byBucket.set(Number(d.bucket), Number(d.count) || 0));
  const distribution = [1, 2, 3, 4, 5].map((b) => ({ bucket: b, count: byBucket.get(b) ?? 0 }));
  return {
    count: Number(raw.count) || 0,
    avg: raw.avg == null ? null : Number(raw.avg),
    awaiting_reply: Number(raw.awaiting_reply) || 0,
    reply_rate: Number(raw.reply_rate) || 0,
    this_period: Number(raw.this_period) || 0,
    distribution,
  };
}

export function useBusinessReviews(
  businessId: string | undefined,
  opts: UseBusinessReviewsOpts = {},
) {
  const filter = opts.filter ?? 'all';
  const sort = opts.sort ?? 'recent';
  const limit = opts.limit ?? 100;

  return useQuery({
    queryKey: ['business-reviews', businessId, filter, sort, limit],
    enabled: !!businessId,
    staleTime: 60 * 1000,
    queryFn: async (): Promise<BusinessReviewsResult> => {
      if (!businessId) return { reviews: [], summary: EMPTY_SUMMARY };
      const { data, error } = await supabase.rpc('get_business_reviews', {
        p_business_id: businessId,
        p_filter: filter,
        p_sort: sort,
        p_limit: limit,
        p_offset: 0,
      });
      if (error) throw error;
      const raw = (data as any) || {};
      return {
        reviews: Array.isArray(raw.reviews) ? raw.reviews : [],
        summary: normalizeSummary(raw.summary),
      };
    },
  });
}

export function useBusinessReviewsInvalidate(businessId: string | undefined) {
  const qc = useQueryClient();
  return () => {
    if (!businessId) return;
    qc.invalidateQueries({ queryKey: ['business-reviews', businessId] });
  };
}

/* ─────────── Reply mutations (scoped to business, invalidates hub) ─────────── */

export function usePostReviewReply(businessId: string | undefined) {
  const qc = useQueryClient();
  const { session } = useSupabaseSession();
  return useMutation({
    mutationFn: async ({
      reviewId,
      responseText,
    }: { reviewId: string; responseText: string }) => {
      if (!businessId) throw new Error('Missing business');
      if (!session?.user?.id) throw new Error('Not authenticated');
      const text = responseText.trim();
      if (!text) throw new Error('Reply cannot be empty');
      if (text.length > 1000) throw new Error('Reply is too long (max 1000)');

      const { data, error } = await supabase
        .from('review_responses')
        .insert({
          review_id: reviewId,
          business_id: businessId,
          responded_by: session.user.id,
          response_text: text,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      if (businessId) qc.invalidateQueries({ queryKey: ['business-reviews', businessId] });
    },
    onError: (err: any) => toast.error(err?.message || 'Could not post reply'),
  });
}

export function useUpdateReviewReply(businessId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      responseId,
      responseText,
    }: { responseId: string; responseText: string }) => {
      const text = responseText.trim();
      if (!text) throw new Error('Reply cannot be empty');
      if (text.length > 1000) throw new Error('Reply is too long (max 1000)');
      const { data, error } = await supabase
        .from('review_responses')
        .update({ response_text: text, edited_at: new Date().toISOString() })
        .eq('id', responseId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      if (businessId) qc.invalidateQueries({ queryKey: ['business-reviews', businessId] });
    },
    onError: (err: any) => toast.error(err?.message || 'Could not update reply'),
  });
}

export function useDeleteReviewReply(businessId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ responseId }: { responseId: string }) => {
      const { error } = await supabase.rpc('soft_delete_review_response', {
        p_response_id: responseId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      if (businessId) qc.invalidateQueries({ queryKey: ['business-reviews', businessId] });
    },
    onError: (err: any) => toast.error(err?.message || 'Could not delete reply'),
  });
}
