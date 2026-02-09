import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

export interface ReviewResponse {
  id: string;
  review_id: string;
  response_text: string;
  created_at: string;
  business_id: string;
  business_name: string;
  business_slug: string | null;
  business_logo_url: string | null;
  business_is_verified: boolean | null;
}

export function useReviewResponses(courseId: string | undefined) {
  return useQuery({
    queryKey: ['review-responses', courseId],
    enabled: !!courseId,
    queryFn: async (): Promise<ReviewResponse[]> => {
      if (!courseId) return [];

      // Get all review IDs for this course first
      const { data: reviews } = await supabase
        .from('course_ratings' as any)
        .select('id')
        .eq('course_id', courseId);

      if (!reviews || reviews.length === 0) return [];

      const reviewIds = (reviews as any[]).map((r) => r.id);

      const { data, error } = await supabase
        .from('review_responses')
        .select(`
          id, review_id, response_text, created_at, business_id,
          business_accounts!inner(name, slug, logo_url, is_verified)
        `)
        .in('review_id', reviewIds)
        .eq('is_deleted', false);

      if (error) {
        console.error('[useReviewResponses]', error);
        return [];
      }

      return ((data as any[]) || []).map((r) => ({
        id: r.id,
        review_id: r.review_id,
        response_text: r.response_text,
        created_at: r.created_at,
        business_id: r.business_id,
        business_name: r.business_accounts?.name || '',
        business_slug: r.business_accounts?.slug || null,
        business_logo_url: r.business_accounts?.logo_url || null,
        business_is_verified: r.business_accounts?.is_verified || null,
      }));
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useSubmitReviewResponse(courseId: string) {
  const queryClient = useQueryClient();
  const { session } = useSupabaseSession();

  return useMutation({
    mutationFn: async ({
      reviewId,
      businessId,
      responseText,
    }: {
      reviewId: string;
      businessId: string;
      responseText: string;
    }) => {
      if (!session?.user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('review_responses')
        .insert({
          review_id: reviewId,
          business_id: businessId,
          responded_by: session.user.id,
          response_text: responseText,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review-responses', courseId] });
    },
  });
}
