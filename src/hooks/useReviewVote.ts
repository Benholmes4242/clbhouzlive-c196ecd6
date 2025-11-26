import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from './useSupabaseSession';
import { toast } from 'sonner';

export type VoteValue = 'helpful' | 'unhelpful' | 'clear';

interface VoteParams {
  reviewId: string;
  value: VoteValue;
}

export function useReviewVote(courseId: string) {
  const { user } = useSupabaseSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reviewId, value }: VoteParams) => {
      if (!user) {
        throw new Error('Must be logged in to vote');
      }

      // Clear vote - delete the row
      if (value === 'clear') {
        const { error } = await supabase
          .from('course_review_votes')
          .delete()
          .eq('rating_id', reviewId)
          .eq('user_id', user.id);

        if (error) throw error;
        return { reviewId, value: null };
      }

      // Upsert vote (insert or update)
      const { error } = await supabase
        .from('course_review_votes')
        .upsert(
          {
            rating_id: reviewId,
            user_id: user.id,
            vote_type: value,
          },
          {
            onConflict: 'rating_id,user_id',
          }
        );

      if (error) throw error;
      return { reviewId, value };
    },
    onSuccess: () => {
      // Refetch reviews to get updated vote counts
      queryClient.refetchQueries({
        queryKey: ['course-reviews-full', courseId],
      });
    },
    onError: (error: Error) => {
      console.error('Vote error:', error);
      toast.error('Failed to record your vote. Please try again.');
    },
  });
}
